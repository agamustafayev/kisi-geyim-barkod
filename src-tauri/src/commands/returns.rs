use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Return {
    pub id: i64,
    pub iade_nomresi: String,
    pub satis_id: i64,
    pub satis_nomresi: Option<String>,
    pub musteri_id: Option<i64>,
    pub musteri_adi: Option<String>,
    pub toplam_mebleg: f64,
    pub sebebi: Option<String>,
    pub qeyd: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReturnItem {
    pub id: i64,
    pub iade_id: i64,
    pub mehsul_id: i64,
    pub mehsul_adi: Option<String>,
    pub mehsul_barkod: Option<String>,
    pub olcu_id: i64,
    pub olcu: Option<String>,
    pub miqdar: i32,
    pub vahid_qiymeti: f64,
    pub toplam_qiymet: f64,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateReturn {
    pub satis_id: i64,
    pub items: Vec<CreateReturnItem>,
    pub sebebi: Option<String>,
    pub qeyd: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateReturnItem {
    pub mehsul_id: i64,
    pub olcu_id: i64,
    pub miqdar: i32,
    pub vahid_qiymeti: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReturnWithItems {
    #[serde(flatten)]
    pub iade: Return,
    pub items: Vec<ReturnItem>,
}

#[tauri::command]
pub async fn iade_yarat(
    state: State<'_, AppState>,
    iade: CreateReturn,
) -> Result<Return, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Generate return number
    let iade_nomresi = format!("I-{}", Uuid::new_v4().to_string()[..8].to_uppercase());

    // Get sale info
    let (musteri_id, satis_nomresi): (Option<i64>, String) = db
        .conn
        .query_row(
            "SELECT musteri_id, satis_nomresi FROM sales WHERE id = ?1",
            [iade.satis_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| format!("Satış tapılmadı: {}", e))?;

    // Check if any item has already been returned
    for item in &iade.items {
        let already_returned: Result<i32, _> = db
            .conn
            .query_row(
                "SELECT COUNT(*) FROM return_items ri
                 JOIN returns r ON ri.iade_id = r.id
                 WHERE r.satis_id = ?1 AND ri.mehsul_id = ?2 AND ri.olcu_id = ?3",
                [iade.satis_id, item.mehsul_id, item.olcu_id],
                |row| row.get(0),
            );

        if let Ok(count) = already_returned {
            if count > 0 {
                // Get product name for error message
                let mehsul_adi: String = db
                    .conn
                    .query_row(
                        "SELECT p.ad || ' (' || sz.olcu || ')' FROM products p
                         JOIN sizes sz ON sz.id = ?2
                         WHERE p.id = ?1",
                        [item.mehsul_id, item.olcu_id],
                        |row| row.get(0),
                    )
                    .unwrap_or_else(|_| "Məhsul".to_string());

                return Err(format!("'{}' məhsulu artıq bu satış üçün geri qaytarılıb", mehsul_adi));
            }
        }
    }

    // Calculate total
    let toplam_mebleg: f64 = iade
        .items
        .iter()
        .map(|item| item.vahid_qiymeti * item.miqdar as f64)
        .sum();

    // Insert return
    db.conn
        .execute(
            "INSERT INTO returns (iade_nomresi, satis_id, musteri_id, toplam_mebleg, sebebi, qeyd)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                iade_nomresi,
                iade.satis_id,
                musteri_id,
                toplam_mebleg,
                iade.sebebi,
                iade.qeyd,
            ],
        )
        .map_err(|e| format!("Geri Qaytarma yaradıla bilmədi: {}", e))?;

    let iade_id = db.conn.last_insert_rowid();

    // Insert return items and update stock
    for item in &iade.items {
        let toplam_qiymet = item.vahid_qiymeti * item.miqdar as f64;

        // Insert return item
        db.conn
            .execute(
                "INSERT INTO return_items (iade_id, mehsul_id, olcu_id, miqdar, vahid_qiymeti, toplam_qiymet)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                rusqlite::params![
                    iade_id,
                    item.mehsul_id,
                    item.olcu_id,
                    item.miqdar,
                    item.vahid_qiymeti,
                    toplam_qiymet,
                ],
            )
            .map_err(|e| format!("Geri Qaytarma elementi əlavə edilə bilmədi: {}", e))?;

        // Update stock (add back)
        let evvelki: i32 = db
            .conn
            .query_row(
                "SELECT miqdar FROM stock WHERE mehsul_id = ?1 AND olcu_id = ?2",
                [item.mehsul_id, item.olcu_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let yeni = evvelki + item.miqdar;

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
                 VALUES (?1, ?2, 'Daxil olma', ?3, ?4, ?5, ?6)",
                rusqlite::params![
                    item.mehsul_id,
                    item.olcu_id,
                    item.miqdar,
                    evvelki,
                    yeni,
                    format!("Geri Qaytarma: {}", iade_nomresi),
                ],
            )
            .ok();
    }

    // If customer has debt (Nisyə), reduce the debt
    if let Some(cust_id) = musteri_id {
        // Check if original sale was Nisyə
        let odenis_usulu: String = db
            .conn
            .query_row(
                "SELECT odenis_usulu FROM sales WHERE id = ?1",
                [iade.satis_id],
                |row| row.get(0),
            )
            .unwrap_or_default();

        if odenis_usulu == "Nisyə" {
            // Add a payment to reduce debt
            db.conn
                .execute(
                    "INSERT INTO debt_payments (musteri_id, mebleg, odenis_usulu, qeyd)
                     VALUES (?1, ?2, 'Geri Qaytarma', ?3)",
                    rusqlite::params![cust_id, toplam_mebleg, format!("Geri Qaytarma: {}", iade_nomresi)],
                )
                .ok();
        }
    }

    // Get the created return
    let result = db
        .conn
        .query_row(
            "SELECT r.*, s.satis_nomresi, c.ad || ' ' || c.soyad as musteri_adi
             FROM returns r
             JOIN sales s ON r.satis_id = s.id
             LEFT JOIN customers c ON r.musteri_id = c.id
             WHERE r.id = ?1",
            [iade_id],
            |row| {
                Ok(Return {
                    id: row.get(0)?,
                    iade_nomresi: row.get(1)?,
                    satis_id: row.get(2)?,
                    musteri_id: row.get(3)?,
                    toplam_mebleg: row.get(4)?,
                    sebebi: row.get(5)?,
                    qeyd: row.get(6)?,
                    created_at: row.get(7)?,
                    satis_nomresi: row.get(8)?,
                    musteri_adi: row.get(9)?,
                })
            },
        )
        .map_err(|e| format!("Geri Qaytarma tapılmadı: {}", e))?;

    Ok(result)
}

#[tauri::command]
pub async fn iade_siyahisi(state: State<'_, AppState>) -> Result<Vec<Return>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db
        .conn
        .prepare(
            "SELECT r.*, s.satis_nomresi, c.ad || ' ' || c.soyad as musteri_adi
             FROM returns r
             JOIN sales s ON r.satis_id = s.id
             LEFT JOIN customers c ON r.musteri_id = c.id
             ORDER BY r.created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let returns = stmt
        .query_map([], |row| {
            Ok(Return {
                id: row.get(0)?,
                iade_nomresi: row.get(1)?,
                satis_id: row.get(2)?,
                musteri_id: row.get(3)?,
                toplam_mebleg: row.get(4)?,
                sebebi: row.get(5)?,
                qeyd: row.get(6)?,
                created_at: row.get(7)?,
                satis_nomresi: row.get(8)?,
                musteri_adi: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(returns)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn iade_detallari(
    state: State<'_, AppState>,
    iade_id: i64,
) -> Result<ReturnWithItems, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Get return
    let iade = db
        .conn
        .query_row(
            "SELECT r.*, s.satis_nomresi, c.ad || ' ' || c.soyad as musteri_adi
             FROM returns r
             JOIN sales s ON r.satis_id = s.id
             LEFT JOIN customers c ON r.musteri_id = c.id
             WHERE r.id = ?1",
            [iade_id],
            |row| {
                Ok(Return {
                    id: row.get(0)?,
                    iade_nomresi: row.get(1)?,
                    satis_id: row.get(2)?,
                    musteri_id: row.get(3)?,
                    toplam_mebleg: row.get(4)?,
                    sebebi: row.get(5)?,
                    qeyd: row.get(6)?,
                    created_at: row.get(7)?,
                    satis_nomresi: row.get(8)?,
                    musteri_adi: row.get(9)?,
                })
            },
        )
        .map_err(|e| format!("Geri Qaytarma tapılmadı: {}", e))?;

    // Get return items
    let mut stmt = db
        .conn
        .prepare(
            "SELECT ri.*, p.ad as mehsul_adi, p.barkod as mehsul_barkod, sz.olcu
             FROM return_items ri
             JOIN products p ON ri.mehsul_id = p.id
             JOIN sizes sz ON ri.olcu_id = sz.id
             WHERE ri.iade_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([iade_id], |row| {
            Ok(ReturnItem {
                id: row.get(0)?,
                iade_id: row.get(1)?,
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

    Ok(ReturnWithItems { iade, items })
}
