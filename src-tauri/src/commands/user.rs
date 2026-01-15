use crate::models::{CreateUser, UpdateUser, UserPublic, LoginRequest, LoginResponse};
use crate::AppState;
use tauri::State;

#[tauri::command(rename_all = "camelCase")]
pub async fn giris_yap(
    state: State<'_, AppState>,
    login: LoginRequest,
) -> Result<LoginResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let user = db
        .conn
        .query_row(
            "SELECT id, ad, soyad, istifadeci_adi, sifre, rol, aktiv, created_at 
             FROM users WHERE istifadeci_adi = ?1",
            [&login.istifadeci_adi],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, bool>(6)?,
                    row.get::<_, Option<String>>(7)?,
                ))
            },
        )
        .map_err(|_| "İstifadəçi adı və ya şifrə yanlışdır".to_string())?;

    let (id, ad, soyad, istifadeci_adi, sifre, rol, aktiv, created_at) = user;

    // Check password
    if sifre != login.sifre {
        return Err("İstifadəçi adı və ya şifrə yanlışdır".to_string());
    }

    // Check if active
    if !aktiv {
        return Err("Bu hesab deaktiv edilib".to_string());
    }

    Ok(LoginResponse {
        user: UserPublic {
            id,
            ad,
            soyad,
            istifadeci_adi,
            rol,
            aktiv,
            created_at,
        },
        message: "Giriş uğurlu!".to_string(),
    })
}

#[tauri::command(rename_all = "camelCase")]
pub async fn istifadeci_elave_et(
    state: State<'_, AppState>,
    user: CreateUser,
) -> Result<UserPublic, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn
        .execute(
            "INSERT INTO users (ad, soyad, istifadeci_adi, sifre, rol) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![user.ad, user.soyad, user.istifadeci_adi, user.sifre, user.rol],
        )
        .map_err(|e| {
            if e.to_string().contains("UNIQUE") {
                "Bu istifadəçi adı artıq mövcuddur".to_string()
            } else {
                format!("İstifadəçi əlavə edilə bilmədi: {}", e)
            }
        })?;

    let id = db.conn.last_insert_rowid();

    Ok(UserPublic {
        id,
        ad: user.ad,
        soyad: user.soyad,
        istifadeci_adi: user.istifadeci_adi,
        rol: user.rol,
        aktiv: true,
        created_at: None,
    })
}

#[tauri::command(rename_all = "camelCase")]
pub async fn istifadeci_siyahisi(state: State<'_, AppState>) -> Result<Vec<UserPublic>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db
        .conn
        .prepare(
            "SELECT id, ad, soyad, istifadeci_adi, rol, aktiv, created_at 
             FROM users ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let users = stmt
        .query_map([], |row| {
            Ok(UserPublic {
                id: row.get(0)?,
                ad: row.get(1)?,
                soyad: row.get(2)?,
                istifadeci_adi: row.get(3)?,
                rol: row.get(4)?,
                aktiv: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(users)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn istifadeci_yenile(
    state: State<'_, AppState>,
    id: i64,
    user: UpdateUser,
) -> Result<UserPublic, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Build dynamic update query
    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref ad) = user.ad {
        updates.push("ad = ?");
        params.push(Box::new(ad.clone()));
    }
    if let Some(ref soyad) = user.soyad {
        updates.push("soyad = ?");
        params.push(Box::new(soyad.clone()));
    }
    if let Some(ref istifadeci_adi) = user.istifadeci_adi {
        updates.push("istifadeci_adi = ?");
        params.push(Box::new(istifadeci_adi.clone()));
    }
    if let Some(ref sifre) = user.sifre {
        updates.push("sifre = ?");
        params.push(Box::new(sifre.clone()));
    }
    if let Some(ref rol) = user.rol {
        updates.push("rol = ?");
        params.push(Box::new(rol.clone()));
    }
    if let Some(aktiv) = user.aktiv {
        updates.push("aktiv = ?");
        params.push(Box::new(aktiv));
    }

    if updates.is_empty() {
        return Err("Heç bir dəyişiklik yoxdur".to_string());
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    let query = format!("UPDATE users SET {} WHERE id = ?", updates.join(", "));
    params.push(Box::new(id));

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    db.conn
        .execute(&query, params_refs.as_slice())
        .map_err(|e| format!("İstifadəçi yenilənə bilmədi: {}", e))?;

    // Return updated user
    let updated = db
        .conn
        .query_row(
            "SELECT id, ad, soyad, istifadeci_adi, rol, aktiv, created_at 
             FROM users WHERE id = ?1",
            [id],
            |row| {
                Ok(UserPublic {
                    id: row.get(0)?,
                    ad: row.get(1)?,
                    soyad: row.get(2)?,
                    istifadeci_adi: row.get(3)?,
                    rol: row.get(4)?,
                    aktiv: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(updated)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn istifadeci_sil(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Prevent deleting the last admin
    let admin_count: i32 = db
        .conn
        .query_row(
            "SELECT COUNT(*) FROM users WHERE rol = 'admin' AND aktiv = 1",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let is_admin: bool = db
        .conn
        .query_row(
            "SELECT rol = 'admin' FROM users WHERE id = ?1",
            [id],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if is_admin && admin_count <= 1 {
        return Err("Son admin istifadəçini silə bilməzsiniz".to_string());
    }

    db.conn
        .execute("DELETE FROM users WHERE id = ?1", [id])
        .map_err(|e| format!("İstifadəçi silinə bilmədi: {}", e))?;

    Ok(())
}

#[tauri::command(rename_all = "camelCase")]
pub async fn sifre_deyis(
    state: State<'_, AppState>,
    id: i64,
    kohne_sifre: String,
    yeni_sifre: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Verify old password
    let current_password: String = db
        .conn
        .query_row("SELECT sifre FROM users WHERE id = ?1", [id], |row| {
            row.get(0)
        })
        .map_err(|_| "İstifadəçi tapılmadı".to_string())?;

    if current_password != kohne_sifre {
        return Err("Köhnə şifrə yanlışdır".to_string());
    }

    db.conn
        .execute(
            "UPDATE users SET sifre = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
            rusqlite::params![yeni_sifre, id],
        )
        .map_err(|e| format!("Şifrə dəyişdirilə bilmədi: {}", e))?;

    Ok(())
}
