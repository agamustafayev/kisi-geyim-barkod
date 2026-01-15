use crate::models::{CreateSale, Sale, SaleItem, SaleWithItems};
use crate::AppState;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn satis_yarat(
    state: State<'_, AppState>,
    satis: CreateSale,
) -> Result<Sale, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Generate sale number
    let satis_nomresi = format!("S-{}", Uuid::new_v4().to_string()[..8].to_uppercase());
    
    // Calculate totals
    let toplam_mebleg: f64 = satis.items.iter()
        .map(|item| item.vahid_qiymeti * item.miqdar as f64)
        .sum();
    
    let son_mebleg = toplam_mebleg - satis.endirim;
    
    // Insert sale with customer_id
    db.conn
        .execute(
            "INSERT INTO sales (satis_nomresi, musteri_id, toplam_mebleg, endirim, son_mebleg, odenis_usulu, qeyd)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                satis_nomresi,
                satis.musteri_id,
                toplam_mebleg,
                satis.endirim,
                son_mebleg,
                satis.odenis_usulu,
                satis.qeyd,
            ],
        )
        .map_err(|e| format!("Satış yaradıla bilmədi: {}", e))?;
    
    let satis_id = db.conn.last_insert_rowid();
    
    // Insert sale items and update stock
    for item in &satis.items {
        let toplam_qiymet = item.vahid_qiymeti * item.miqdar as f64;
        
        // Insert sale item
        db.conn
            .execute(
                "INSERT INTO sale_items (satis_id, mehsul_id, olcu_id, miqdar, vahid_qiymeti, toplam_qiymet)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                rusqlite::params![
                    satis_id,
                    item.mehsul_id,
                    item.olcu_id,
                    item.miqdar,
                    item.vahid_qiymeti,
                    toplam_qiymet,
                ],
            )
            .map_err(|e| format!("Satış elementi əlavə edilə bilmədi: {}", e))?;
        
        // Update stock
        let evvelki: i32 = db.conn
            .query_row(
                "SELECT miqdar FROM stock WHERE mehsul_id = ?1 AND olcu_id = ?2",
                [item.mehsul_id, item.olcu_id],
                |row| row.get(0),
            )
            .unwrap_or(0);
        
        let yeni = evvelki - item.miqdar;
        
        db.conn
            .execute(
                "UPDATE stock SET miqdar = ?1, updated_at = CURRENT_TIMESTAMP
                 WHERE mehsul_id = ?2 AND olcu_id = ?3",
                rusqlite::params![yeni, item.mehsul_id, item.olcu_id],
            )
            .ok();
        
        // Log stock movement
        db.conn
            .execute(
                "INSERT INTO stock_movements (mehsul_id, olcu_id, novu, miqdar, evvelki_miqdar, yeni_miqdar, qeyd)
                 VALUES (?1, ?2, 'Çıxış', ?3, ?4, ?5, ?6)",
                rusqlite::params![
                    item.mehsul_id,
                    item.olcu_id,
                    item.miqdar,
                    evvelki,
                    yeni,
                    format!("Satış: {}", satis_nomresi),
                ],
            )
            .ok();
    }
    
    // Get the created sale with customer name
    let sale = db.conn
        .query_row(
            "SELECT s.id, s.satis_nomresi, s.musteri_id, 
                    CASE WHEN c.id IS NOT NULL THEN c.ad || ' ' || c.soyad ELSE NULL END as musteri_adi,
                    s.toplam_mebleg, s.endirim, s.son_mebleg, s.odenis_usulu, s.qeyd, s.created_at
             FROM sales s
             LEFT JOIN customers c ON s.musteri_id = c.id
             WHERE s.id = ?1",
            [satis_id],
            |row| {
                Ok(Sale {
                    id: row.get(0)?,
                    satis_nomresi: row.get(1)?,
                    musteri_id: row.get(2)?,
                    musteri_adi: row.get(3)?,
                    toplam_mebleg: row.get(4)?,
                    endirim: row.get(5)?,
                    son_mebleg: row.get(6)?,
                    odenis_usulu: row.get(7)?,
                    qeyd: row.get(8)?,
                    created_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| format!("Satış tapılmadı: {}", e))?;
    
    Ok(sale)
}

#[tauri::command]
pub async fn satis_siyahisi(state: State<'_, AppState>) -> Result<Vec<Sale>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.conn
        .prepare(
            "SELECT s.id, s.satis_nomresi, s.musteri_id, 
                    CASE WHEN c.id IS NOT NULL THEN c.ad || ' ' || c.soyad ELSE NULL END as musteri_adi,
                    s.toplam_mebleg, s.endirim, s.son_mebleg, s.odenis_usulu, s.qeyd, s.created_at
             FROM sales s
             LEFT JOIN customers c ON s.musteri_id = c.id
             ORDER BY s.created_at DESC"
        )
        .map_err(|e| e.to_string())?;
    
    let sales = stmt
        .query_map([], |row| {
            Ok(Sale {
                id: row.get(0)?,
                satis_nomresi: row.get(1)?,
                musteri_id: row.get(2)?,
                musteri_adi: row.get(3)?,
                toplam_mebleg: row.get(4)?,
                endirim: row.get(5)?,
                son_mebleg: row.get(6)?,
                odenis_usulu: row.get(7)?,
                qeyd: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(sales)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn satis_detallari(
    state: State<'_, AppState>,
    satis_id: i64,
) -> Result<SaleWithItems, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Get sale with customer info
    let sale = db.conn
        .query_row(
            "SELECT s.id, s.satis_nomresi, s.musteri_id, 
                    CASE WHEN c.id IS NOT NULL THEN c.ad || ' ' || c.soyad ELSE NULL END as musteri_adi,
                    s.toplam_mebleg, s.endirim, s.son_mebleg, s.odenis_usulu, s.qeyd, s.created_at
             FROM sales s
             LEFT JOIN customers c ON s.musteri_id = c.id
             WHERE s.id = ?1",
            [satis_id],
            |row| {
                Ok(Sale {
                    id: row.get(0)?,
                    satis_nomresi: row.get(1)?,
                    musteri_id: row.get(2)?,
                    musteri_adi: row.get(3)?,
                    toplam_mebleg: row.get(4)?,
                    endirim: row.get(5)?,
                    son_mebleg: row.get(6)?,
                    odenis_usulu: row.get(7)?,
                    qeyd: row.get(8)?,
                    created_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| format!("Satış tapılmadı: {}", e))?;
    
    // Get sale items
    let mut stmt = db.conn
        .prepare(
            "SELECT si.*, p.ad as mehsul_adi, p.barkod as mehsul_barkod, sz.olcu
             FROM sale_items si
             JOIN products p ON si.mehsul_id = p.id
             JOIN sizes sz ON si.olcu_id = sz.id
             WHERE si.satis_id = ?1",
        )
        .map_err(|e| e.to_string())?;
    
    let items = stmt
        .query_map([satis_id], |row| {
            Ok(SaleItem {
                id: row.get(0)?,
                satis_id: row.get(1)?,
                mehsul_id: row.get(2)?,
                olcu_id: row.get(3)?,
                miqdar: row.get(4)?,
                vahid_qiymeti: row.get(5)?,
                toplam_qiymet: row.get(6)?,
                created_at: row.get(7)?,
                mehsul_adi: row.get(8)?,
                mehsul_barkod: row.get(9)?,
                olcu: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(SaleWithItems { sale, items })
}
