use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stock {
    pub id: i64,
    pub mehsul_id: i64,
    pub mehsul_adi: Option<String>,
    pub mehsul_barkod: Option<String>,
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
