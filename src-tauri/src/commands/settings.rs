use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub id: i64,
    pub magaza_adi: String,
    pub logo_yolu: Option<String>,
    pub telefon: Option<String>,
    pub adres: Option<String>,
    pub whatsapp: Option<String>,
    pub instagram: Option<String>,
    pub tiktok: Option<String>,
    pub olculer_aktiv: bool,
    pub qifil_sifresi: Option<String>,
    pub barkod_capinda_magaza_adi: bool,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSettings {
    pub magaza_adi: Option<String>,
    pub logo_yolu: Option<String>,
    pub telefon: Option<String>,
    pub adres: Option<String>,
    pub whatsapp: Option<String>,
    pub instagram: Option<String>,
    pub tiktok: Option<String>,
    pub olculer_aktiv: Option<bool>,
    pub qifil_sifresi: Option<String>,
    pub barkod_capinda_magaza_adi: Option<bool>,
}

#[tauri::command]
pub async fn parametrleri_al(state: State<'_, AppState>) -> Result<Settings, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Əgər settings yoxdursa, default dəyərlərlə yarat
    db.conn
        .execute(
            "INSERT OR IGNORE INTO settings (id, magaza_adi) VALUES (1, 'Mağaza')",
            [],
        )
        .map_err(|e| format!("Default parametrlər yaradıla bilmədi: {}", e))?;

    let settings = db
        .conn
        .query_row(
            "SELECT id, magaza_adi, logo_yolu, telefon, adres, whatsapp, instagram, tiktok, olculer_aktiv, qifil_sifresi, barkod_capinda_magaza_adi, updated_at
             FROM settings WHERE id = 1",
            [],
            |row| {
                let olculer_aktiv_int: i64 = row.get(8)?;
                let barkod_capinda_magaza_adi_int: i64 = row.get(10)?;
                Ok(Settings {
                    id: row.get(0)?,
                    magaza_adi: row.get(1)?,
                    logo_yolu: row.get(2)?,
                    telefon: row.get(3)?,
                    adres: row.get(4)?,
                    whatsapp: row.get(5)?,
                    instagram: row.get(6)?,
                    tiktok: row.get(7)?,
                    olculer_aktiv: olculer_aktiv_int != 0,
                    qifil_sifresi: row.get(9)?,
                    barkod_capinda_magaza_adi: barkod_capinda_magaza_adi_int != 0,
                    updated_at: row.get(11)?,
                })
            },
        )
        .map_err(|e| format!("Parametrlər tapılmadı: {}", e))?;

    Ok(settings)
}

#[tauri::command]
pub async fn parametrleri_yenile(
    state: State<'_, AppState>,
    settings: UpdateSettings,
) -> Result<Settings, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let olculer_aktiv_int = settings.olculer_aktiv.map(|v| if v { 1 } else { 0 });
    let barkod_capinda_magaza_adi_int = settings.barkod_capinda_magaza_adi.map(|v| if v { 1 } else { 0 });
    
    db.conn
        .execute(
            "UPDATE settings SET 
                magaza_adi = COALESCE(?1, magaza_adi),
                logo_yolu = ?2,
                telefon = ?3,
                adres = ?4,
                whatsapp = ?5,
                instagram = ?6,
                tiktok = ?7,
                olculer_aktiv = COALESCE(?8, olculer_aktiv),
                qifil_sifresi = ?9,
                barkod_capinda_magaza_adi = COALESCE(?10, barkod_capinda_magaza_adi),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = 1",
            rusqlite::params![
                settings.magaza_adi,
                settings.logo_yolu,
                settings.telefon,
                settings.adres,
                settings.whatsapp,
                settings.instagram,
                settings.tiktok,
                olculer_aktiv_int,
                settings.qifil_sifresi,
                barkod_capinda_magaza_adi_int,
            ],
        )
        .map_err(|e| format!("Parametrlər yenilənə bilmədi: {}", e))?;

    // Return updated settings
    let updated = db
        .conn
        .query_row(
            "SELECT id, magaza_adi, logo_yolu, telefon, adres, whatsapp, instagram, tiktok, olculer_aktiv, qifil_sifresi, barkod_capinda_magaza_adi, updated_at 
             FROM settings WHERE id = 1",
            [],
            |row| {
                let olculer_aktiv_int: i64 = row.get(8)?;
                let barkod_capinda_magaza_adi_int: i64 = row.get(10)?;
                Ok(Settings {
                    id: row.get(0)?,
                    magaza_adi: row.get(1)?,
                    logo_yolu: row.get(2)?,
                    telefon: row.get(3)?,
                    adres: row.get(4)?,
                    whatsapp: row.get(5)?,
                    instagram: row.get(6)?,
                    tiktok: row.get(7)?,
                    olculer_aktiv: olculer_aktiv_int != 0,
                    qifil_sifresi: row.get(9)?,
                    barkod_capinda_magaza_adi: barkod_capinda_magaza_adi_int != 0,
                    updated_at: row.get(11)?,
                })
            },
        )
        .map_err(|e| format!("Parametrlər tapılmadı: {}", e))?;

    Ok(updated)
}
