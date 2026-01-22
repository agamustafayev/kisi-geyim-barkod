use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub id: i64,
    pub ad: String,
    pub soyad: String,
    pub telefon: String,
    pub qeyd: Option<String>,
    pub baslangic_borcu: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCustomer {
    pub ad: String,
    pub soyad: String,
    pub telefon: String,
    pub qeyd: Option<String>,
    pub baslangic_borcu: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCustomer {
    pub ad: Option<String>,
    pub soyad: Option<String>,
    pub telefon: Option<String>,
    pub qeyd: Option<String>,
}
