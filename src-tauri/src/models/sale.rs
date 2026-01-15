use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Sale {
    pub id: i64,
    pub satis_nomresi: String,
    pub musteri_id: Option<i64>,
    pub musteri_adi: Option<String>,
    pub toplam_mebleg: f64,
    pub endirim: f64,
    pub son_mebleg: f64,
    pub odenis_usulu: String,
    pub qeyd: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSale {
    pub items: Vec<CreateSaleItem>,
    pub endirim: f64,
    pub odenis_usulu: String,
    pub musteri_id: Option<i64>,
    pub qeyd: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSaleItem {
    pub mehsul_id: i64,
    pub olcu_id: i64,
    pub miqdar: i32,
    pub vahid_qiymeti: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaleItem {
    pub id: i64,
    pub satis_id: i64,
    pub mehsul_id: i64,
    pub mehsul_adi: Option<String>,
    pub mehsul_barkod: Option<String>,
    pub olcu_id: i64,
    pub olcu: Option<String>,
    pub miqdar: i32,
    pub vahid_qiymeti: f64,
    pub toplam_qiymet: f64,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaleWithItems {
    #[serde(flatten)]
    pub sale: Sale,
    pub items: Vec<SaleItem>,
}
