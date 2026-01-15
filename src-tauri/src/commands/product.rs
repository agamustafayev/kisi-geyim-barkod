use crate::models::{CreateProduct, Product, UpdateProduct};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn mehsul_elave_et(
    state: State<'_, AppState>,
    mehsul: CreateProduct,
) -> Result<Product, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Insert product
    db.conn
        .execute(
            "INSERT INTO products (barkod, ad, kateqoriya_id, reng, marka, alis_qiymeti, satis_qiymeti, tesvir, sekil_yolu)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                mehsul.barkod,
                mehsul.ad,
                mehsul.kateqoriya_id,
                mehsul.reng,
                mehsul.marka,
                mehsul.alis_qiymeti,
                mehsul.satis_qiymeti,
                mehsul.tesvir,
                mehsul.sekil_yolu,
            ],
        )
        .map_err(|e| format!("Məhsul əlavə edilə bilmədi: {}", e))?;
    
    let id = db.conn.last_insert_rowid();
    
    // Get the inserted product with category name
    let product = db.conn
        .query_row(
            "SELECT p.*, c.ad as kateqoriya_adi 
             FROM products p 
             LEFT JOIN categories c ON p.kateqoriya_id = c.id 
             WHERE p.id = ?1",
            [id],
            |row| {
                Ok(Product {
                    id: row.get(0)?,
                    barkod: row.get(1)?,
                    ad: row.get(2)?,
                    kateqoriya_id: row.get(3)?,
                    reng: row.get(4)?,
                    marka: row.get(5)?,
                    alis_qiymeti: row.get(6)?,
                    satis_qiymeti: row.get(7)?,
                    tesvir: row.get(8)?,
                    sekil_yolu: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                    kateqoriya_adi: row.get(12)?,
                })
            },
        )
        .map_err(|e| format!("Məhsul tapılmadı: {}", e))?;
    
    Ok(product)
}

#[tauri::command]
pub async fn mehsul_siyahisi(state: State<'_, AppState>) -> Result<Vec<Product>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.conn
        .prepare(
            "SELECT p.*, c.ad as kateqoriya_adi 
             FROM products p 
             LEFT JOIN categories c ON p.kateqoriya_id = c.id 
             ORDER BY p.created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    
    let products = stmt
        .query_map([], |row| {
            Ok(Product {
                id: row.get(0)?,
                barkod: row.get(1)?,
                ad: row.get(2)?,
                kateqoriya_id: row.get(3)?,
                reng: row.get(4)?,
                marka: row.get(5)?,
                alis_qiymeti: row.get(6)?,
                satis_qiymeti: row.get(7)?,
                tesvir: row.get(8)?,
                sekil_yolu: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                kateqoriya_adi: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(products)
}

#[tauri::command]
pub async fn mehsul_axtar(
    state: State<'_, AppState>,
    axtaris: String,
) -> Result<Vec<Product>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let search_term = format!("%{}%", axtaris);
    
    let mut stmt = db.conn
        .prepare(
            "SELECT p.*, c.ad as kateqoriya_adi 
             FROM products p 
             LEFT JOIN categories c ON p.kateqoriya_id = c.id 
             WHERE p.barkod LIKE ?1 OR p.ad LIKE ?1 OR p.marka LIKE ?1
             ORDER BY p.ad",
        )
        .map_err(|e| e.to_string())?;
    
    let products = stmt
        .query_map([&search_term], |row| {
            Ok(Product {
                id: row.get(0)?,
                barkod: row.get(1)?,
                ad: row.get(2)?,
                kateqoriya_id: row.get(3)?,
                reng: row.get(4)?,
                marka: row.get(5)?,
                alis_qiymeti: row.get(6)?,
                satis_qiymeti: row.get(7)?,
                tesvir: row.get(8)?,
                sekil_yolu: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                kateqoriya_adi: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(products)
}

#[tauri::command]
pub async fn mehsul_barkod_ile_axtar(
    state: State<'_, AppState>,
    barkod: String,
) -> Result<Option<Product>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let result = db.conn
        .query_row(
            "SELECT p.*, c.ad as kateqoriya_adi 
             FROM products p 
             LEFT JOIN categories c ON p.kateqoriya_id = c.id 
             WHERE p.barkod = ?1",
            [&barkod],
            |row| {
                Ok(Product {
                    id: row.get(0)?,
                    barkod: row.get(1)?,
                    ad: row.get(2)?,
                    kateqoriya_id: row.get(3)?,
                    reng: row.get(4)?,
                    marka: row.get(5)?,
                    alis_qiymeti: row.get(6)?,
                    satis_qiymeti: row.get(7)?,
                    tesvir: row.get(8)?,
                    sekil_yolu: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                    kateqoriya_adi: row.get(12)?,
                })
            },
        );
    
    match result {
        Ok(product) => Ok(Some(product)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Axtarış xətası: {}", e)),
    }
}

#[tauri::command]
pub async fn mehsul_yenile(
    state: State<'_, AppState>,
    id: i64,
    mehsul: UpdateProduct,
) -> Result<Product, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Build dynamic update query
    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(ref barkod) = mehsul.barkod {
        updates.push("barkod = ?");
        params.push(Box::new(barkod.clone()));
    }
    if let Some(ref ad) = mehsul.ad {
        updates.push("ad = ?");
        params.push(Box::new(ad.clone()));
    }
    if let Some(kateqoriya_id) = mehsul.kateqoriya_id {
        updates.push("kateqoriya_id = ?");
        params.push(Box::new(kateqoriya_id));
    }
    if let Some(ref reng) = mehsul.reng {
        updates.push("reng = ?");
        params.push(Box::new(reng.clone()));
    }
    if let Some(ref marka) = mehsul.marka {
        updates.push("marka = ?");
        params.push(Box::new(marka.clone()));
    }
    if let Some(alis_qiymeti) = mehsul.alis_qiymeti {
        updates.push("alis_qiymeti = ?");
        params.push(Box::new(alis_qiymeti));
    }
    if let Some(satis_qiymeti) = mehsul.satis_qiymeti {
        updates.push("satis_qiymeti = ?");
        params.push(Box::new(satis_qiymeti));
    }
    if let Some(ref tesvir) = mehsul.tesvir {
        updates.push("tesvir = ?");
        params.push(Box::new(tesvir.clone()));
    }
    if let Some(ref sekil_yolu) = mehsul.sekil_yolu {
        updates.push("sekil_yolu = ?");
        params.push(Box::new(sekil_yolu.clone()));
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    
    let query = format!(
        "UPDATE products SET {} WHERE id = ?",
        updates.join(", ")
    );
    
    params.push(Box::new(id));
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    db.conn
        .execute(&query, params_refs.as_slice())
        .map_err(|e| format!("Məhsul yenilənə bilmədi: {}", e))?;
    
    // Get updated product
    let product = db.conn
        .query_row(
            "SELECT p.*, c.ad as kateqoriya_adi 
             FROM products p 
             LEFT JOIN categories c ON p.kateqoriya_id = c.id 
             WHERE p.id = ?1",
            [id],
            |row| {
                Ok(Product {
                    id: row.get(0)?,
                    barkod: row.get(1)?,
                    ad: row.get(2)?,
                    kateqoriya_id: row.get(3)?,
                    reng: row.get(4)?,
                    marka: row.get(5)?,
                    alis_qiymeti: row.get(6)?,
                    satis_qiymeti: row.get(7)?,
                    tesvir: row.get(8)?,
                    sekil_yolu: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                    kateqoriya_adi: row.get(12)?,
                })
            },
        )
        .map_err(|e| format!("Məhsul tapılmadı: {}", e))?;
    
    Ok(product)
}

#[tauri::command]
pub async fn mehsul_sil(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.conn
        .execute("DELETE FROM products WHERE id = ?1", [id])
        .map_err(|e| format!("Məhsul silinə bilmədi: {}", e))?;
    
    Ok(())
}
