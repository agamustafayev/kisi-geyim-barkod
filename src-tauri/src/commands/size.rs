use crate::models::{CreateSize, Size};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn olcu_elave_et(
    state: State<'_, AppState>,
    olcu: CreateSize,
) -> Result<Size, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.conn
        .execute(
            "INSERT INTO sizes (olcu) VALUES (?1)",
            [&olcu.olcu],
        )
        .map_err(|e| format!("Ölçü əlavə edilə bilmədi: {}", e))?;
    
    let id = db.conn.last_insert_rowid();
    
    let size = db.conn
        .query_row(
            "SELECT id, olcu, created_at FROM sizes WHERE id = ?1",
            [id],
            |row| {
                Ok(Size {
                    id: row.get(0)?,
                    olcu: row.get(1)?,
                    created_at: row.get(2)?,
                })
            },
        )
        .map_err(|e| format!("Ölçü tapılmadı: {}", e))?;
    
    Ok(size)
}

#[tauri::command]
pub async fn olcu_siyahisi(state: State<'_, AppState>) -> Result<Vec<Size>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.conn
        .prepare("SELECT id, olcu, created_at FROM sizes ORDER BY id")
        .map_err(|e| e.to_string())?;
    
    let sizes = stmt
        .query_map([], |row| {
            Ok(Size {
                id: row.get(0)?,
                olcu: row.get(1)?,
                created_at: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(sizes)
}

#[tauri::command]
pub async fn olcu_yenile(
    state: State<'_, AppState>,
    id: i64,
    olcu: String,
) -> Result<Size, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Check if the new value already exists for a different size
    let existing = db.conn.query_row(
        "SELECT COUNT(*) FROM sizes WHERE olcu = ?1 AND id != ?2",
        rusqlite::params![&olcu, id],
        |row| row.get::<_, i32>(0),
    ).map_err(|e| format!("Yoxlama zamanı xəta: {}", e))?;

    if existing > 0 {
        return Err("Bu ölçü adı artıq mövcuddur".to_string());
    }

    db.conn
        .execute(
            "UPDATE sizes SET olcu = ?1 WHERE id = ?2",
            rusqlite::params![olcu, id],
        )
        .map_err(|e| format!("Ölçü yenilənə bilmədi: {}", e))?;

    let size = db
        .conn
        .query_row(
            "SELECT id, olcu, created_at FROM sizes WHERE id = ?1",
            [id],
            |row| {
                Ok(Size {
                    id: row.get(0)?,
                    olcu: row.get(1)?,
                    created_at: row.get(2)?,
                })
            },
        )
        .map_err(|e| format!("Ölçü tapılmadı: {}", e))?;

    Ok(size)
}

#[tauri::command]
pub async fn olcu_sil(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute("DELETE FROM sizes WHERE id = ?1", [id])
        .map_err(|e| format!("Ölçü silinə bilmədi: {}", e))?;

    Ok(())
}
