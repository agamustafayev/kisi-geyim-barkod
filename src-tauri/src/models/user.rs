use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub ad: String,
    pub soyad: String,
    pub istifadeci_adi: String,
    #[serde(skip_serializing)]
    pub sifre: String,
    pub rol: String, // "admin" or "isci"
    pub aktiv: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserPublic {
    pub id: i64,
    pub ad: String,
    pub soyad: String,
    pub istifadeci_adi: String,
    pub rol: String,
    pub aktiv: bool,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUser {
    pub ad: String,
    pub soyad: String,
    pub istifadeci_adi: String,
    pub sifre: String,
    pub rol: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateUser {
    pub ad: Option<String>,
    pub soyad: Option<String>,
    pub istifadeci_adi: Option<String>,
    pub sifre: Option<String>,
    pub rol: Option<String>,
    pub aktiv: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub istifadeci_adi: String,
    pub sifre: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user: UserPublic,
    pub message: String,
}
