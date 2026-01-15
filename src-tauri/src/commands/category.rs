use crate::models::{Category, CreateCategory};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn kateqoriya_elave_et(
    state: State<'_, AppState>,
    kateqoriya: CreateCategory,
) -> Result<Category, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.conn
        .execute(
            "INSERT INTO categories (ad) VALUES (?1)",
            [&kateqoriya.ad],
        )
        .map_err(|e| format!("Kateqoriya əlavə edilə bilmədi: {}", e))?;
    
    let id = db.conn.last_insert_rowid();
    
    let category = db.conn
        .query_row(
            "SELECT id, ad, created_at FROM categories WHERE id = ?1",
            [id],
            |row| {
                Ok(Category {
                    id: row.get(0)?,
                    ad: row.get(1)?,
                    created_at: row.get(2)?,
                })
            },
        )
        .map_err(|e| format!("Kateqoriya tapılmadı: {}", e))?;
    
    Ok(category)
}

#[tauri::command]
pub async fn kateqoriya_siyahisi(state: State<'_, AppState>) -> Result<Vec<Category>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.conn
        .prepare("SELECT id, ad, created_at FROM categories ORDER BY ad")
        .map_err(|e| e.to_string())?;
    
    let categories = stmt
        .query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                ad: row.get(1)?,
                created_at: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(categories)
}

#[tauri::command]
pub async fn kateqoriya_yenile(
    state: State<'_, AppState>,
    id: i64,
    ad: String,
) -> Result<Category, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute(
            "UPDATE categories SET ad = ?1 WHERE id = ?2",
            rusqlite::params![&ad, id],
        )
        .map_err(|e| format!("Kateqoriya yenilənə bilmədi: {}", e))?;

    let category = db.conn
        .query_row(
            "SELECT id, ad, created_at FROM categories WHERE id = ?1",
            [id],
            |row| {
                Ok(Category {
                    id: row.get(0)?,
                    ad: row.get(1)?,
                    created_at: row.get(2)?,
                })
            },
        )
        .map_err(|e| format!("Kateqoriya tapılmadı: {}", e))?;

    Ok(category)
}

#[tauri::command]
pub async fn kateqoriya_sil(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute("DELETE FROM categories WHERE id = ?1", [id])
        .map_err(|e| format!("Kateqoriya silinə bilmədi: {}", e))?;

    Ok(())
}
