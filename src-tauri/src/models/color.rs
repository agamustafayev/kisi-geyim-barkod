use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Color {
    pub id: i64,
    pub ad: String,
    pub kod: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateColor {
    pub ad: String,
    pub kod: Option<String>,
}
