use crate::models::{CreateCustomer, Customer, UpdateCustomer};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn musteri_elave_et(
    state: State<'_, AppState>,
    musteri: CreateCustomer,
) -> Result<Customer, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute(
            "INSERT INTO customers (ad, soyad, telefon, qeyd, baslangic_borcu) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                musteri.ad, 
                musteri.soyad, 
                musteri.telefon, 
                musteri.qeyd,
                musteri.baslangic_borcu.unwrap_or(0.0)
            ],
        )
        .map_err(|e| {
            if e.to_string().contains("UNIQUE constraint failed") {
                "Bu telefon nömrəsi ilə müştəri artıq mövcuddur".to_string()
            } else {
                format!("Müştəri əlavə edilə bilmədi: {}", e)
            }
        })?;

    let id = db.conn.last_insert_rowid();

    let customer = db
        .conn
        .query_row("SELECT * FROM customers WHERE id = ?1", [id], |row| {
            Ok(Customer {
                id: row.get(0)?,
                ad: row.get(1)?,
                soyad: row.get(2)?,
                telefon: row.get(3)?,
                qeyd: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| format!("Müştəri tapılmadı: {}", e))?;

    Ok(customer)
}

#[tauri::command]
pub async fn musteri_siyahisi(state: State<'_, AppState>) -> Result<Vec<Customer>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db
        .conn
        .prepare("SELECT * FROM customers ORDER BY ad, soyad")
        .map_err(|e| e.to_string())?;

    let customers = stmt
        .query_map([], |row| {
            Ok(Customer {
                id: row.get(0)?,
                ad: row.get(1)?,
                soyad: row.get(2)?,
                telefon: row.get(3)?,
                qeyd: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(customers)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn musteri_axtar(
    state: State<'_, AppState>,
    axtaris: String,
) -> Result<Vec<Customer>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let search_term = format!("%{}%", axtaris);

    let mut stmt = db
        .conn
        .prepare(
            "SELECT * FROM customers 
             WHERE ad LIKE ?1 OR soyad LIKE ?1 OR telefon LIKE ?1 
             ORDER BY ad, soyad 
             LIMIT 20",
        )
        .map_err(|e| e.to_string())?;

    let customers = stmt
        .query_map([&search_term], |row| {
            Ok(Customer {
                id: row.get(0)?,
                ad: row.get(1)?,
                soyad: row.get(2)?,
                telefon: row.get(3)?,
                qeyd: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(customers)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn musteri_yenile(
    state: State<'_, AppState>,
    id: i64,
    musteri: UpdateCustomer,
) -> Result<Customer, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut query = String::from("UPDATE customers SET updated_at = CURRENT_TIMESTAMP");

    if let Some(ref ad) = musteri.ad {
        query.push_str(&format!(", ad = '{}'", ad));
    }
    if let Some(ref soyad) = musteri.soyad {
        query.push_str(&format!(", soyad = '{}'", soyad));
    }
    if let Some(ref telefon) = musteri.telefon {
        query.push_str(&format!(", telefon = '{}'", telefon));
    }
    if let Some(ref qeyd) = musteri.qeyd {
        query.push_str(&format!(", qeyd = '{}'", qeyd));
    }

    query.push_str(&format!(" WHERE id = {}", id));

    db.conn
        .execute(&query, [])
        .map_err(|e| format!("Müştəri yenilənə bilmədi: {}", e))?;

    let customer = db
        .conn
        .query_row("SELECT * FROM customers WHERE id = ?1", [id], |row| {
            Ok(Customer {
                id: row.get(0)?,
                ad: row.get(1)?,
                soyad: row.get(2)?,
                telefon: row.get(3)?,
                qeyd: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| format!("Müştəri tapılmadı: {}", e))?;

    Ok(customer)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn musteri_sil(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute("DELETE FROM customers WHERE id = ?1", [id])
        .map_err(|e| format!("Müştəri silinə bilmədi: {}", e))?;

    Ok(())
}

#[tauri::command(rename_all = "camelCase")]
pub async fn musteri_nisye_borclari(
    state: State<'_, AppState>,
    musteri_id: i64,
) -> Result<f64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Başlangıç borcu
    let baslangic_borcu: f64 = db
        .conn
        .query_row(
            "SELECT COALESCE(baslangic_borcu, 0) FROM customers WHERE id = ?1",
            [musteri_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // Toplam nisyə satışları
    let toplam_borc: f64 = db
        .conn
        .query_row(
            "SELECT COALESCE(SUM(son_mebleg), 0) FROM sales WHERE musteri_id = ?1 AND odenis_usulu = 'Nisyə'",
            [musteri_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // Toplam ödəmələr
    let toplam_odenis: f64 = db
        .conn
        .query_row(
            "SELECT COALESCE(SUM(mebleg), 0) FROM debt_payments WHERE musteri_id = ?1",
            [musteri_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // Qalan borc = başlangıç borcu + satışlar - ödəmələr
    let qalan_borc = baslangic_borcu + toplam_borc - toplam_odenis;
    
    Ok(if qalan_borc > 0.0 { qalan_borc } else { 0.0 })
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct CustomerSaleItem {
    pub id: i64,
    pub satis_nomresi: String,
    pub toplam_mebleg: f64,
    pub endirim: f64,
    pub son_mebleg: f64,
    pub odenis_usulu: String,
    pub created_at: String,
}

#[tauri::command(rename_all = "camelCase")]
pub async fn musteri_satis_kecmisi(
    state: State<'_, AppState>,
    musteri_id: i64,
) -> Result<Vec<CustomerSaleItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db
        .conn
        .prepare(
            "SELECT id, satis_nomresi, toplam_mebleg, endirim, son_mebleg, odenis_usulu, created_at
             FROM sales
             WHERE musteri_id = ?1
             ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let sales = stmt
        .query_map([musteri_id], |row| {
            Ok(CustomerSaleItem {
                id: row.get(0)?,
                satis_nomresi: row.get(1)?,
                toplam_mebleg: row.get(2)?,
                endirim: row.get(3)?,
                son_mebleg: row.get(4)?,
                odenis_usulu: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(sales)
}
