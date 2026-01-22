use crate::models::{CreateStock, Stock, UpdateStock};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn stok_elave_et(
    state: State<'_, AppState>,
    stok: CreateStock,
) -> Result<Stock, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let minimum = stok.minimum_miqdar.unwrap_or(1);
    
    db.conn
        .execute(
            "INSERT INTO stock (mehsul_id, olcu_id, miqdar, minimum_miqdar)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(mehsul_id, olcu_id) DO UPDATE SET
             miqdar = miqdar + excluded.miqdar,
             updated_at = CURRENT_TIMESTAMP",
            rusqlite::params![stok.mehsul_id, stok.olcu_id, stok.miqdar, minimum],
        )
        .map_err(|e| format!("Stok əlavə edilə bilmədi: {}", e))?;

    // Get product alis_qiymeti for logging
    let alis_qiymeti: f64 = db.conn
        .query_row(
            "SELECT alis_qiymeti FROM products WHERE id = ?1",
            [stok.mehsul_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let toplam_deyeri = stok.miqdar as f64 * alis_qiymeti;

    // Log stock movement with price info
    db.conn
        .execute(
            "INSERT INTO stock_movements (mehsul_id, olcu_id, novu, miqdar, vahid_alis_qiymeti, toplam_deyeri, qeyd)
             VALUES (?1, ?2, 'Daxil olma', ?3, ?4, ?5, 'Stok əlavə edildi')",
            rusqlite::params![stok.mehsul_id, stok.olcu_id, stok.miqdar, alis_qiymeti, toplam_deyeri],
        )
        .ok();
    
    // Get the stock record
    let stock = db.conn
        .query_row(
            "SELECT s.*, p.ad as mehsul_adi, p.barkod as mehsul_barkod, 
                    p.kateqoriya_id, c.ad as kateqoriya_adi, sz.olcu
             FROM stock s
             JOIN products p ON s.mehsul_id = p.id
             LEFT JOIN categories c ON p.kateqoriya_id = c.id
             JOIN sizes sz ON s.olcu_id = sz.id
             WHERE s.mehsul_id = ?1 AND s.olcu_id = ?2",
            [stok.mehsul_id, stok.olcu_id],
            |row| {
                Ok(Stock {
                    id: row.get(0)?,
                    mehsul_id: row.get(1)?,
                    olcu_id: row.get(2)?,
                    miqdar: row.get(3)?,
                    minimum_miqdar: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    mehsul_adi: row.get(7)?,
                    mehsul_barkod: row.get(8)?,
                    kateqoriya_id: row.get(9)?,
                    kateqoriya_adi: row.get(10)?,
                    olcu: row.get(11)?,
                })
            },
        )
        .map_err(|e| format!("Stok tapılmadı: {}", e))?;
    
    Ok(stock)
}

#[tauri::command]
pub async fn stok_yenile(
    state: State<'_, AppState>,
    mehsulId: i64,
    olcuId: i64,
    stok: UpdateStock,
) -> Result<Stock, String> {
    println!("stok_yenile called: mehsul_id={}, olcu_id={}, miqdar={}", mehsulId, olcuId, stok.miqdar);
    
    let mehsul_id = mehsulId;
    let olcu_id = olcuId;
    
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Get current stock (if exists)
    let evvelki: i32 = db.conn
        .query_row(
            "SELECT miqdar FROM stock WHERE mehsul_id = ?1 AND olcu_id = ?2",
            [mehsul_id, olcu_id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    println!("Previous stock: {}", evvelki);
    
    let minimum = stok.minimum_miqdar.unwrap_or(1);
    
    // Use INSERT OR REPLACE to handle both insert and update
    db.conn
        .execute(
            "INSERT INTO stock (mehsul_id, olcu_id, miqdar, minimum_miqdar) 
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(mehsul_id, olcu_id) DO UPDATE SET 
             miqdar = excluded.miqdar,
             minimum_miqdar = excluded.minimum_miqdar,
             updated_at = CURRENT_TIMESTAMP",
            rusqlite::params![mehsul_id, olcu_id, stok.miqdar, minimum],
        )
        .map_err(|e| format!("Stok yenilənə bilmədi: {}", e))?;
    
    // Log stock movement only if there's a change
    if stok.miqdar != evvelki {
        let novu = if stok.miqdar > evvelki { "Daxil olma" } else { "Çıxış" };
        let ferq = (stok.miqdar - evvelki).abs();

        // Get product alis_qiymeti for logging (only for "Daxil olma")
        let (vahid_alis_qiymeti, toplam_deyeri): (Option<f64>, Option<f64>) = if novu == "Daxil olma" {
            let alis_qiymeti: f64 = db.conn
                .query_row(
                    "SELECT alis_qiymeti FROM products WHERE id = ?1",
                    [mehsul_id],
                    |row| row.get(0),
                )
                .unwrap_or(0.0);
            (Some(alis_qiymeti), Some(ferq as f64 * alis_qiymeti))
        } else {
            (None, None)
        };

        db.conn
            .execute(
                "INSERT INTO stock_movements (mehsul_id, olcu_id, novu, miqdar, evvelki_miqdar, yeni_miqdar, vahid_alis_qiymeti, toplam_deyeri, qeyd)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'Stok düzəliş')",
                rusqlite::params![mehsul_id, olcu_id, novu, ferq, evvelki, stok.miqdar, vahid_alis_qiymeti, toplam_deyeri],
            )
            .ok();
    }
    
    // Get updated stock
    let stock = db.conn
        .query_row(
            "SELECT s.*, p.ad as mehsul_adi, p.barkod as mehsul_barkod, 
                    p.kateqoriya_id, c.ad as kateqoriya_adi, sz.olcu
             FROM stock s
             JOIN products p ON s.mehsul_id = p.id
             LEFT JOIN categories c ON p.kateqoriya_id = c.id
             JOIN sizes sz ON s.olcu_id = sz.id
             WHERE s.mehsul_id = ?1 AND s.olcu_id = ?2",
            [mehsul_id, olcu_id],
            |row| {
                Ok(Stock {
                    id: row.get(0)?,
                    mehsul_id: row.get(1)?,
                    olcu_id: row.get(2)?,
                    miqdar: row.get(3)?,
                    minimum_miqdar: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    mehsul_adi: row.get(7)?,
                    mehsul_barkod: row.get(8)?,
                    kateqoriya_id: row.get(9)?,
                    kateqoriya_adi: row.get(10)?,
                    olcu: row.get(11)?,
                })
            },
        )
        .map_err(|e| format!("Stok tapılmadı: {}", e))?;
    
    Ok(stock)
}

#[tauri::command]
pub async fn stok_siyahisi(state: State<'_, AppState>) -> Result<Vec<Stock>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.conn
        .prepare(
            "SELECT s.*, p.ad as mehsul_adi, p.barkod as mehsul_barkod, 
                    p.kateqoriya_id, c.ad as kateqoriya_adi, sz.olcu
             FROM stock s
             JOIN products p ON s.mehsul_id = p.id
             LEFT JOIN categories c ON p.kateqoriya_id = c.id
             JOIN sizes sz ON s.olcu_id = sz.id
             ORDER BY p.ad, sz.olcu",
        )
        .map_err(|e| e.to_string())?;
    
    let stocks = stmt
        .query_map([], |row| {
            Ok(Stock {
                id: row.get(0)?,
                mehsul_id: row.get(1)?,
                olcu_id: row.get(2)?,
                miqdar: row.get(3)?,
                minimum_miqdar: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                mehsul_adi: row.get(7)?,
                mehsul_barkod: row.get(8)?,
                kateqoriya_id: row.get(9)?,
                kateqoriya_adi: row.get(10)?,
                olcu: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(stocks)
}

#[tauri::command]
pub async fn stok_mehsul_ucun(
    state: State<'_, AppState>,
    mehsulId: i64,
) -> Result<Vec<Stock>, String> {
    let mehsul_id = mehsulId;
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.conn
        .prepare(
            "SELECT s.*, p.ad as mehsul_adi, p.barkod as mehsul_barkod, 
                    p.kateqoriya_id, c.ad as kateqoriya_adi, sz.olcu
             FROM stock s
             JOIN products p ON s.mehsul_id = p.id
             LEFT JOIN categories c ON p.kateqoriya_id = c.id
             JOIN sizes sz ON s.olcu_id = sz.id
             WHERE s.mehsul_id = ?1
             ORDER BY sz.id",
        )
        .map_err(|e| e.to_string())?;
    
    let stocks = stmt
        .query_map([mehsul_id], |row| {
            Ok(Stock {
                id: row.get(0)?,
                mehsul_id: row.get(1)?,
                olcu_id: row.get(2)?,
                miqdar: row.get(3)?,
                minimum_miqdar: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                mehsul_adi: row.get(7)?,
                mehsul_barkod: row.get(8)?,
                kateqoriya_id: row.get(9)?,
                kateqoriya_adi: row.get(10)?,
                olcu: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(stocks)
}

#[tauri::command]
pub async fn stok_sil(
    state: State<'_, AppState>,
    mehsulId: i64,
    olcuId: i64,
) -> Result<(), String> {
    let mehsul_id = mehsulId;
    let olcu_id = olcuId;
    
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Get current stock for logging
    let miqdar: i32 = db.conn
        .query_row(
            "SELECT miqdar FROM stock WHERE mehsul_id = ?1 AND olcu_id = ?2",
            [mehsul_id, olcu_id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    // Delete stock record
    db.conn
        .execute(
            "DELETE FROM stock WHERE mehsul_id = ?1 AND olcu_id = ?2",
            [mehsul_id, olcu_id],
        )
        .map_err(|e| format!("Stok silinə bilmədi: {}", e))?;
    
    // Log stock movement
    db.conn
        .execute(
            "INSERT INTO stock_movements (mehsul_id, olcu_id, novu, miqdar, qeyd)
             VALUES (?1, ?2, 'Çıxış', ?3, 'Stok silindi')",
            rusqlite::params![mehsul_id, olcu_id, miqdar],
        )
        .ok();
    
    Ok(())
}
