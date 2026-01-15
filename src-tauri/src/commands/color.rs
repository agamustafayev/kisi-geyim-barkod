use crate::models::{Color, CreateColor};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn reng_elave_et(
    state: State<'_, AppState>,
    reng: CreateColor,
) -> Result<Color, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute(
            "INSERT INTO colors (ad, kod) VALUES (?1, ?2)",
            rusqlite::params![&reng.ad, &reng.kod],
        )
        .map_err(|e| format!("Rəng əlavə edilə bilmədi: {}", e))?;

    let id = db.conn.last_insert_rowid();

    let color = db.conn
        .query_row(
            "SELECT id, ad, kod, created_at FROM colors WHERE id = ?1",
            [id],
            |row| {
                Ok(Color {
                    id: row.get(0)?,
                    ad: row.get(1)?,
                    kod: row.get(2)?,
                    created_at: row.get(3)?,
                })
            },
        )
        .map_err(|e| format!("Rəng tapılmadı: {}", e))?;

    Ok(color)
}

#[tauri::command]
pub async fn reng_siyahisi(state: State<'_, AppState>) -> Result<Vec<Color>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db.conn
        .prepare("SELECT id, ad, kod, created_at FROM colors ORDER BY ad")
        .map_err(|e| e.to_string())?;

    let colors = stmt
        .query_map([], |row| {
            Ok(Color {
                id: row.get(0)?,
                ad: row.get(1)?,
                kod: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(colors)
}

#[tauri::command]
pub async fn reng_yenile(
    state: State<'_, AppState>,
    id: i64,
    ad: String,
    kod: Option<String>,
) -> Result<Color, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute(
            "UPDATE colors SET ad = ?1, kod = ?2 WHERE id = ?3",
            rusqlite::params![&ad, &kod, id],
        )
        .map_err(|e| format!("Rəng yenilənə bilmədi: {}", e))?;

    let color = db.conn
        .query_row(
            "SELECT id, ad, kod, created_at FROM colors WHERE id = ?1",
            [id],
            |row| {
                Ok(Color {
                    id: row.get(0)?,
                    ad: row.get(1)?,
                    kod: row.get(2)?,
                    created_at: row.get(3)?,
                })
            },
        )
        .map_err(|e| format!("Rəng tapılmadı: {}", e))?;

    Ok(color)
}

#[tauri::command]
pub async fn reng_sil(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute("DELETE FROM colors WHERE id = ?1", [id])
        .map_err(|e| format!("Rəng silinə bilmədi: {}", e))?;

    Ok(())
}
