use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DebtPayment {
    pub id: i64,
    pub musteri_id: i64,
    pub musteri_adi: Option<String>,
    pub mebleg: f64,
    pub odenis_usulu: String,
    pub qeyd: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDebtPayment {
    pub musteri_id: i64,
    pub mebleg: f64,
    pub odenis_usulu: String,
    pub qeyd: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerDebtSummary {
    pub musteri_id: i64,
    pub musteri_adi: String,
    pub telefon: String,
    pub toplam_borc: f64,
    pub toplam_odenis: f64,
    pub qalan_borc: f64,
}

#[tauri::command]
pub async fn borc_odeme_yarat(
    state: State<'_, AppState>,
    odeme: CreateDebtPayment,
) -> Result<DebtPayment, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute(
            "INSERT INTO debt_payments (musteri_id, mebleg, odenis_usulu, qeyd) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![odeme.musteri_id, odeme.mebleg, odeme.odenis_usulu, odeme.qeyd],
        )
        .map_err(|e| format!("Ödəmə yaradıla bilmədi: {}", e))?;

    let id = db.conn.last_insert_rowid();

    let payment = db
        .conn
        .query_row(
            "SELECT dp.*, c.ad || ' ' || c.soyad as musteri_adi
             FROM debt_payments dp
             JOIN customers c ON dp.musteri_id = c.id
             WHERE dp.id = ?1",
            [id],
            |row| {
                Ok(DebtPayment {
                    id: row.get(0)?,
                    musteri_id: row.get(1)?,
                    mebleg: row.get(2)?,
                    odenis_usulu: row.get(3)?,
                    qeyd: row.get(4)?,
                    created_at: row.get(5)?,
                    musteri_adi: row.get(6)?,
                })
            },
        )
        .map_err(|e| format!("Ödəmə tapılmadı: {}", e))?;

    Ok(payment)
}

#[tauri::command]
pub async fn borc_odeme_siyahisi(state: State<'_, AppState>) -> Result<Vec<DebtPayment>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db
        .conn
        .prepare(
            "SELECT dp.*, c.ad || ' ' || c.soyad as musteri_adi
             FROM debt_payments dp
             JOIN customers c ON dp.musteri_id = c.id
             ORDER BY dp.created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let payments = stmt
        .query_map([], |row| {
            Ok(DebtPayment {
                id: row.get(0)?,
                musteri_id: row.get(1)?,
                mebleg: row.get(2)?,
                odenis_usulu: row.get(3)?,
                qeyd: row.get(4)?,
                created_at: row.get(5)?,
                musteri_adi: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(payments)
}

#[tauri::command]
pub async fn musteri_borc_xulasesi(
    state: State<'_, AppState>,
) -> Result<Vec<CustomerDebtSummary>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db
        .conn
        .prepare(
            "SELECT 
                c.id as musteri_id,
                c.ad || ' ' || c.soyad as musteri_adi,
                c.telefon,
                COALESCE(c.baslangic_borcu, 0) + COALESCE((SELECT SUM(son_mebleg) FROM sales WHERE musteri_id = c.id AND odenis_usulu = 'Nisyə'), 0) as toplam_borc,
                COALESCE((SELECT SUM(mebleg) FROM debt_payments WHERE musteri_id = c.id), 0) as toplam_odenis
             FROM customers c
             WHERE (COALESCE(c.baslangic_borcu, 0) > 0)
                OR EXISTS (SELECT 1 FROM sales WHERE musteri_id = c.id AND odenis_usulu = 'Nisyə')
                OR EXISTS (SELECT 1 FROM debt_payments WHERE musteri_id = c.id)
             ORDER BY (COALESCE(c.baslangic_borcu, 0) + COALESCE((SELECT SUM(son_mebleg) FROM sales WHERE musteri_id = c.id AND odenis_usulu = 'Nisyə'), 0) 
                     - COALESCE((SELECT SUM(mebleg) FROM debt_payments WHERE musteri_id = c.id), 0)) DESC",
        )
        .map_err(|e| e.to_string())?;

    let summaries = stmt
        .query_map([], |row| {
            let toplam_borc: f64 = row.get(3)?;
            let toplam_odenis: f64 = row.get(4)?;
            Ok(CustomerDebtSummary {
                musteri_id: row.get(0)?,
                musteri_adi: row.get(1)?,
                telefon: row.get(2)?,
                toplam_borc,
                toplam_odenis,
                qalan_borc: toplam_borc - toplam_odenis,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(summaries)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn musteri_odeme_kecmisi(
    state: State<'_, AppState>,
    musteri_id: i64,
) -> Result<Vec<DebtPayment>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db
        .conn
        .prepare(
            "SELECT dp.*, c.ad || ' ' || c.soyad as musteri_adi
             FROM debt_payments dp
             JOIN customers c ON dp.musteri_id = c.id
             WHERE dp.musteri_id = ?1
             ORDER BY dp.created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let payments = stmt
        .query_map([musteri_id], |row| {
            Ok(DebtPayment {
                id: row.get(0)?,
                musteri_id: row.get(1)?,
                mebleg: row.get(2)?,
                odenis_usulu: row.get(3)?,
                qeyd: row.get(4)?,
                created_at: row.get(5)?,
                musteri_adi: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(payments)
}
