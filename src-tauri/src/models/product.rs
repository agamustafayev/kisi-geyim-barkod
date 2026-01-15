use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    pub id: i64,
    pub barkod: String,
    pub ad: String,
    pub kateqoriya_id: Option<i64>,
    pub kateqoriya_adi: Option<String>,
    pub reng: Option<String>,
    pub marka: Option<String>,
    pub alis_qiymeti: f64,
    pub satis_qiymeti: f64,
    pub tesvir: Option<String>,
    pub sekil_yolu: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProduct {
    pub barkod: String,
    pub ad: String,
    pub kateqoriya_id: Option<i64>,
    pub reng: Option<String>,
    pub marka: Option<String>,
    pub alis_qiymeti: f64,
    pub satis_qiymeti: f64,
    pub tesvir: Option<String>,
    pub sekil_yolu: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProduct {
    pub barkod: Option<String>,
    pub ad: Option<String>,
    pub kateqoriya_id: Option<i64>,
    pub reng: Option<String>,
    pub marka: Option<String>,
    pub alis_qiymeti: Option<f64>,
    pub satis_qiymeti: Option<f64>,
    pub tesvir: Option<String>,
    pub sekil_yolu: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductWithStock {
    #[serde(flatten)]
    pub product: Product,
    pub stok: Vec<StockInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockInfo {
    pub olcu_id: i64,
    pub olcu: String,
    pub miqdar: i32,
    pub minimum_miqdar: i32,
}
