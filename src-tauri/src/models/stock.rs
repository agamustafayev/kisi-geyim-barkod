use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stock {
    pub id: i64,
    pub mehsul_id: i64,
    pub mehsul_adi: Option<String>,
    pub mehsul_barkod: Option<String>,
    pub kateqoriya_id: Option<i64>,
    pub kateqoriya_adi: Option<String>,
    pub olcu_id: i64,
    pub olcu: Option<String>,
    pub miqdar: i32,
    pub minimum_miqdar: i32,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateStock {
    pub mehsul_id: i64,
    pub olcu_id: i64,
    pub miqdar: i32,
    pub minimum_miqdar: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateStock {
    pub miqdar: i32,
    pub minimum_miqdar: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockMovement {
    pub id: i64,
    pub mehsul_id: i64,
    pub mehsul_adi: Option<String>,
    pub olcu_id: i64,
    pub olcu: Option<String>,
    pub novu: String,
    pub miqdar: i32,
    pub evvelki_miqdar: Option<i32>,
    pub yeni_miqdar: Option<i32>,
    pub qeyd: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LowStockAlert {
    pub mehsul_id: i64,
    pub mehsul_adi: String,
    pub barkod: String,
    pub olcu: String,
    pub miqdar: i32,
    pub minimum_miqdar: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductStatistics {
    pub mehsul_id: i64,
    pub mehsul_adi: String,
    pub barkod: String,
    pub kateqoriya_id: Option<i64>,
    pub kateqoriya_adi: Option<String>,
    pub toplam_alis_miqdar: i32,
    pub toplam_satis_miqdar: i32,
    pub toplam_alis_deyeri: f64,
    pub toplam_satis_deyeri: f64,
    pub ortalama_qazanc_vahid: f64,
    pub toplam_qazanc: f64,
    pub hazirki_stok: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductStatisticsReport {
    pub baslangic_tarix: String,
    pub bitis_tarix: String,
    pub items: Vec<ProductStatistics>,
    pub umumi_alis_miqdar: i32,
    pub umumi_satis_miqdar: i32,
    pub umumi_alis_deyeri: f64,
    pub umumi_satis_deyeri: f64,
    pub umumi_qazanc: f64,
    pub ortalama_qazanc_faizi: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductMovementDetail {
    pub id: i64,
    pub tarix: String,
    pub novu: String,
    pub miqdar: i32,
    pub vahid_qiymet: Option<f64>,
    pub toplam_deyeri: Option<f64>,
    pub qeyd: Option<String>,
}
