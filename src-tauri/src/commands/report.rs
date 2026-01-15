use crate::models::LowStockAlert;
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct StockValueReport {
    pub toplam_mehsul: i32,
    pub toplam_stok: i32,
    pub alis_deyeri: f64,
    pub satis_deyeri: f64,
    pub potensial_qazanc: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailySalesReport {
    pub tarix: String,
    pub satis_sayi: i32,
    pub toplam_mebleg: f64,
    pub endirim: f64,
    pub net_mebleg: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlySalesReport {
    pub ay: String,
    pub satis_sayi: i32,
    pub toplam_mebleg: f64,
    pub endirim: f64,
    pub net_mebleg: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockReport {
    pub mehsul_id: i64,
    pub mehsul_adi: String,
    pub barkod: String,
    pub olcu: String,
    pub miqdar: i32,
    pub minimum_miqdar: i32,
    pub deger: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProfitReportItem {
    pub mehsul_id: i64,
    pub mehsul_adi: String,
    pub barkod: String,
    pub olcu: String,
    pub miqdar: i32,
    pub alis_qiymeti: f64,
    pub satis_qiymeti: f64,
    pub toplam_alis: f64,
    pub toplam_satis: f64,
    pub qazanc: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfitReport {
    pub baslangic_tarix: String,
    pub bitis_tarix: String,
    pub items: Vec<ProfitReportItem>,
    pub toplam_alis: f64,
    pub toplam_satis: f64,
    pub toplam_qazanc: f64,
    pub toplam_endirim: f64,
    pub net_qazanc: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SalesListFilter {
    pub baslangic_tarix: Option<String>,
    pub bitis_tarix: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaleListItem {
    pub id: i64,
    pub satis_nomresi: String,
    pub toplam_mebleg: f64,
    pub endirim: f64,
    pub son_mebleg: f64,
    pub odenis_usulu: String,
    pub qeyd: Option<String>,
    pub created_at: String,
    pub mehsul_sayi: i32,
}

#[tauri::command]
pub async fn gunluk_satis_hesabati(
    state: State<'_, AppState>,
    tarix: Option<String>,
) -> Result<DailySalesReport, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let date_filter = tarix.unwrap_or_else(|| "date('now')".to_string());
    
    let query = format!(
        "SELECT 
            date(created_at) as tarix,
            COUNT(*) as satis_sayi,
            COALESCE(SUM(toplam_mebleg), 0) as toplam_mebleg,
            COALESCE(SUM(endirim), 0) as endirim,
            COALESCE(SUM(son_mebleg), 0) as net_mebleg
         FROM sales
         WHERE date(created_at) = {}
         GROUP BY date(created_at)",
        if date_filter == "date('now')" { date_filter.clone() } else { format!("'{}'", date_filter) }
    );
    
    let result = db.conn.query_row(&query, [], |row| {
        Ok(DailySalesReport {
            tarix: row.get(0)?,
            satis_sayi: row.get(1)?,
            toplam_mebleg: row.get(2)?,
            endirim: row.get(3)?,
            net_mebleg: row.get(4)?,
        })
    });
    
    match result {
        Ok(report) => Ok(report),
        Err(_) => Ok(DailySalesReport {
            tarix: date_filter,
            satis_sayi: 0,
            toplam_mebleg: 0.0,
            endirim: 0.0,
            net_mebleg: 0.0,
        }),
    }
}

#[tauri::command]
pub async fn ayliq_satis_hesabati(
    state: State<'_, AppState>,
    ay: Option<String>,
) -> Result<MonthlySalesReport, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let month_filter = ay.unwrap_or_else(|| "strftime('%Y-%m', 'now')".to_string());
    
    let query = format!(
        "SELECT 
            strftime('%Y-%m', created_at) as ay,
            COUNT(*) as satis_sayi,
            COALESCE(SUM(toplam_mebleg), 0) as toplam_mebleg,
            COALESCE(SUM(endirim), 0) as endirim,
            COALESCE(SUM(son_mebleg), 0) as net_mebleg
         FROM sales
         WHERE strftime('%Y-%m', created_at) = {}
         GROUP BY strftime('%Y-%m', created_at)",
        if month_filter.contains("strftime") { month_filter.clone() } else { format!("'{}'", month_filter) }
    );
    
    let result = db.conn.query_row(&query, [], |row| {
        Ok(MonthlySalesReport {
            ay: row.get(0)?,
            satis_sayi: row.get(1)?,
            toplam_mebleg: row.get(2)?,
            endirim: row.get(3)?,
            net_mebleg: row.get(4)?,
        })
    });
    
    match result {
        Ok(report) => Ok(report),
        Err(_) => Ok(MonthlySalesReport {
            ay: month_filter,
            satis_sayi: 0,
            toplam_mebleg: 0.0,
            endirim: 0.0,
            net_mebleg: 0.0,
        }),
    }
}

#[tauri::command]
pub async fn stok_hesabati(state: State<'_, AppState>) -> Result<Vec<LowStockAlert>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.conn
        .prepare(
            "SELECT s.mehsul_id, p.ad, p.barkod, sz.olcu, s.miqdar, s.minimum_miqdar
             FROM stock s
             JOIN products p ON s.mehsul_id = p.id
             JOIN sizes sz ON s.olcu_id = sz.id
             WHERE s.miqdar <= s.minimum_miqdar
             ORDER BY s.miqdar ASC",
        )
        .map_err(|e| e.to_string())?;
    
    let alerts = stmt
        .query_map([], |row| {
            Ok(LowStockAlert {
                mehsul_id: row.get(0)?,
                mehsul_adi: row.get(1)?,
                barkod: row.get(2)?,
                olcu: row.get(3)?,
                miqdar: row.get(4)?,
                minimum_miqdar: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(alerts)
}

#[tauri::command]
pub async fn satis_siyahisi_tarixe_gore(
    state: State<'_, AppState>,
    baslangicTarix: Option<String>,
    bitisTarix: Option<String>,
) -> Result<Vec<SaleListItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut query = String::from(
        "SELECT s.id, s.satis_nomresi, s.toplam_mebleg, s.endirim, s.son_mebleg, 
                s.odenis_usulu, s.qeyd, s.created_at,
                (SELECT COUNT(*) FROM sale_items WHERE satis_id = s.id) as mehsul_sayi
         FROM sales s
         WHERE 1=1"
    );
    
    if let Some(ref start) = baslangicTarix {
        query.push_str(&format!(" AND date(s.created_at) >= '{}'", start));
    }
    
    if let Some(ref end) = bitisTarix {
        query.push_str(&format!(" AND date(s.created_at) <= '{}'", end));
    }
    
    query.push_str(" ORDER BY s.created_at DESC");
    
    let mut stmt = db.conn.prepare(&query).map_err(|e| e.to_string())?;
    
    let sales = stmt
        .query_map([], |row| {
            Ok(SaleListItem {
                id: row.get(0)?,
                satis_nomresi: row.get(1)?,
                toplam_mebleg: row.get(2)?,
                endirim: row.get(3)?,
                son_mebleg: row.get(4)?,
                odenis_usulu: row.get(5)?,
                qeyd: row.get(6)?,
                created_at: row.get(7)?,
                mehsul_sayi: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(sales)
}

#[tauri::command]
pub async fn qazanc_hesabati(
    state: State<'_, AppState>,
    baslangicTarix: Option<String>,
    bitisTarix: Option<String>,
) -> Result<ProfitReport, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let start_date = baslangicTarix.unwrap_or_else(|| {
        // Default to start of current month
        chrono::Local::now().format("%Y-%m-01").to_string()
    });
    
    let end_date = bitisTarix.unwrap_or_else(|| {
        chrono::Local::now().format("%Y-%m-%d").to_string()
    });
    
    // Get profit details per product sold
    let query = format!(
        "SELECT 
            p.id as mehsul_id,
            p.ad as mehsul_adi,
            p.barkod,
            sz.olcu,
            SUM(si.miqdar) as miqdar,
            p.alis_qiymeti,
            si.vahid_qiymeti as satis_qiymeti,
            SUM(si.miqdar * p.alis_qiymeti) as toplam_alis,
            SUM(si.toplam_qiymet) as toplam_satis,
            SUM(si.toplam_qiymet) - SUM(si.miqdar * p.alis_qiymeti) as qazanc
         FROM sale_items si
         JOIN sales s ON si.satis_id = s.id
         JOIN products p ON si.mehsul_id = p.id
         JOIN sizes sz ON si.olcu_id = sz.id
         WHERE date(s.created_at) >= '{}' AND date(s.created_at) <= '{}'
         GROUP BY p.id, sz.olcu
         ORDER BY qazanc DESC",
        start_date, end_date
    );
    
    let mut stmt = db.conn.prepare(&query).map_err(|e| e.to_string())?;
    
    let items: Vec<ProfitReportItem> = stmt
        .query_map([], |row| {
            Ok(ProfitReportItem {
                mehsul_id: row.get(0)?,
                mehsul_adi: row.get(1)?,
                barkod: row.get(2)?,
                olcu: row.get(3)?,
                miqdar: row.get(4)?,
                alis_qiymeti: row.get(5)?,
                satis_qiymeti: row.get(6)?,
                toplam_alis: row.get(7)?,
                toplam_satis: row.get(8)?,
                qazanc: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    // Calculate totals
    let toplam_alis: f64 = items.iter().map(|i| i.toplam_alis).sum();
    let toplam_satis: f64 = items.iter().map(|i| i.toplam_satis).sum();
    let toplam_qazanc: f64 = items.iter().map(|i| i.qazanc).sum();
    
    // Get total discount
    let discount_query = format!(
        "SELECT COALESCE(SUM(endirim), 0) FROM sales 
         WHERE date(created_at) >= '{}' AND date(created_at) <= '{}'",
        start_date, end_date
    );
    
    let toplam_endirim: f64 = db.conn
        .query_row(&discount_query, [], |row| row.get(0))
        .unwrap_or(0.0);
    
    Ok(ProfitReport {
        baslangic_tarix: start_date,
        bitis_tarix: end_date,
        items,
        toplam_alis,
        toplam_satis,
        toplam_qazanc,
        toplam_endirim,
        net_qazanc: toplam_qazanc - toplam_endirim,
    })
}

#[tauri::command]
pub async fn stok_deyeri_hesabati(state: State<'_, AppState>) -> Result<StockValueReport, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let result = db.conn.query_row(
        "SELECT
            COUNT(DISTINCT s.mehsul_id) as toplam_mehsul,
            COALESCE(SUM(s.miqdar), 0) as toplam_stok,
            COALESCE(SUM(s.miqdar * p.alis_qiymeti), 0) as alis_deyeri,
            COALESCE(SUM(s.miqdar * p.satis_qiymeti), 0) as satis_deyeri
         FROM stock s
         JOIN products p ON s.mehsul_id = p.id
         WHERE s.miqdar > 0",
        [],
        |row| {
            let toplam_mehsul: i32 = row.get(0)?;
            let toplam_stok: i32 = row.get(1)?;
            let alis_deyeri: f64 = row.get(2)?;
            let satis_deyeri: f64 = row.get(3)?;
            Ok(StockValueReport {
                toplam_mehsul,
                toplam_stok,
                alis_deyeri,
                satis_deyeri,
                potensial_qazanc: satis_deyeri - alis_deyeri,
            })
        },
    );

    match result {
        Ok(report) => Ok(report),
        Err(_) => Ok(StockValueReport {
            toplam_mehsul: 0,
            toplam_stok: 0,
            alis_deyeri: 0.0,
            satis_deyeri: 0.0,
            potensial_qazanc: 0.0,
        }),
    }
}
