use crate::models::{LowStockAlert, ProductStatistics, ProductStatisticsReport, ProductMovementDetail};
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
    pub iade_durumu: String,  // "Yoxdur", "Qismən", "Tam"
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
                (SELECT COUNT(*) FROM sale_items WHERE satis_id = s.id) as mehsul_sayi,
                CASE
                    WHEN (SELECT COUNT(*) FROM returns WHERE satis_id = s.id) = 0 THEN 'Yoxdur'
                    WHEN COALESCE((SELECT SUM(ri.miqdar) FROM return_items ri
                          JOIN returns r ON ri.iade_id = r.id WHERE r.satis_id = s.id), 0)
                          >= (SELECT SUM(miqdar) FROM sale_items WHERE satis_id = s.id) THEN 'Tam'
                    ELSE 'Qismən'
                END as iade_durumu
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
                iade_durumu: row.get(9)?,
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
    
    // Get profit details per product sold - subtract returns
    let query = format!(
        "WITH satislar AS (
            SELECT p.id, p.ad, p.barkod, sz.olcu, sz.id as olcu_id,
                   SUM(si.miqdar) as miqdar,
                   p.alis_qiymeti, si.vahid_qiymeti,
                   SUM(si.miqdar * p.alis_qiymeti) as toplam_alis,
                   SUM(si.toplam_qiymet) as toplam_satis
            FROM sale_items si
            JOIN sales s ON si.satis_id = s.id
            JOIN products p ON si.mehsul_id = p.id
            JOIN sizes sz ON si.olcu_id = sz.id
            WHERE date(s.created_at) >= '{}' AND date(s.created_at) <= '{}'
            GROUP BY p.id, sz.id
         ),
         iadeler AS (
            SELECT ri.mehsul_id, ri.olcu_id,
                   SUM(ri.miqdar) as miqdar,
                   SUM(ri.miqdar * p.alis_qiymeti) as toplam_alis,
                   SUM(ri.toplam_qiymet) as toplam_satis
            FROM return_items ri
            JOIN returns r ON ri.iade_id = r.id
            JOIN products p ON ri.mehsul_id = p.id
            WHERE date(r.created_at) >= '{}' AND date(r.created_at) <= '{}'
            GROUP BY ri.mehsul_id, ri.olcu_id
         )
         SELECT s.id as mehsul_id,
                s.ad as mehsul_adi,
                s.barkod,
                s.olcu,
                s.miqdar - COALESCE(i.miqdar, 0) as miqdar,
                s.alis_qiymeti,
                s.vahid_qiymeti as satis_qiymeti,
                s.toplam_alis - COALESCE(i.toplam_alis, 0) as toplam_alis,
                s.toplam_satis - COALESCE(i.toplam_satis, 0) as toplam_satis,
                (s.toplam_satis - COALESCE(i.toplam_satis, 0)) - (s.toplam_alis - COALESCE(i.toplam_alis, 0)) as qazanc
         FROM satislar s
         LEFT JOIN iadeler i ON s.id = i.mehsul_id AND s.olcu_id = i.olcu_id
         WHERE s.miqdar - COALESCE(i.miqdar, 0) > 0
         ORDER BY qazanc DESC",
        start_date, end_date, start_date, end_date
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

#[tauri::command]
pub async fn mehsul_statistikasi(
    state: State<'_, AppState>,
    baslangicTarix: Option<String>,
    bitisTarix: Option<String>,
    kateqoriyaId: Option<i64>,
) -> Result<ProductStatisticsReport, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let start_date = baslangicTarix.unwrap_or_else(|| {
        chrono::Local::now().format("%Y-%m-01").to_string()
    });

    let end_date = bitisTarix.unwrap_or_else(|| {
        chrono::Local::now().format("%Y-%m-%d").to_string()
    });

    // Category filter
    let category_filter = match kateqoriyaId {
        Some(id) => format!("AND p.kateqoriya_id = {}", id),
        None => String::new(),
    };

    // Complex query to get product statistics
    let query = format!(
        "WITH alislar AS (
            SELECT
                sm.mehsul_id,
                SUM(sm.miqdar) as alis_miqdar,
                SUM(COALESCE(sm.toplam_deyeri, sm.miqdar * p.alis_qiymeti)) as alis_deyeri
            FROM stock_movements sm
            JOIN products p ON sm.mehsul_id = p.id
            WHERE sm.novu = 'Daxil olma'
              AND date(sm.created_at) >= '{0}'
              AND date(sm.created_at) <= '{1}'
              {2}
            GROUP BY sm.mehsul_id
        ),
        satislar AS (
            SELECT
                si.mehsul_id,
                SUM(si.miqdar) as satis_miqdar,
                SUM(si.toplam_qiymet) as satis_deyeri,
                SUM(si.miqdar * p.alis_qiymeti) as satis_maya_deyeri
            FROM sale_items si
            JOIN sales s ON si.satis_id = s.id
            JOIN products p ON si.mehsul_id = p.id
            WHERE date(s.created_at) >= '{0}'
              AND date(s.created_at) <= '{1}'
              {2}
            GROUP BY si.mehsul_id
        ),
        hazirki_stok AS (
            SELECT mehsul_id, SUM(miqdar) as stok
            FROM stock
            GROUP BY mehsul_id
        )
        SELECT
            p.id as mehsul_id,
            p.ad as mehsul_adi,
            p.barkod,
            p.kateqoriya_id,
            c.ad as kateqoriya_adi,
            COALESCE(a.alis_miqdar, 0) as toplam_alis_miqdar,
            COALESCE(s.satis_miqdar, 0) as toplam_satis_miqdar,
            COALESCE(a.alis_deyeri, 0) as toplam_alis_deyeri,
            COALESCE(s.satis_deyeri, 0) as toplam_satis_deyeri,
            CASE
                WHEN COALESCE(s.satis_miqdar, 0) > 0
                THEN (COALESCE(s.satis_deyeri, 0) - COALESCE(s.satis_maya_deyeri, 0)) / s.satis_miqdar
                ELSE 0
            END as ortalama_qazanc_vahid,
            COALESCE(s.satis_deyeri, 0) - COALESCE(s.satis_maya_deyeri, 0) as toplam_qazanc,
            COALESCE(hs.stok, 0) as hazirki_stok
        FROM products p
        LEFT JOIN categories c ON p.kateqoriya_id = c.id
        LEFT JOIN alislar a ON p.id = a.mehsul_id
        LEFT JOIN satislar s ON p.id = s.mehsul_id
        LEFT JOIN hazirki_stok hs ON p.id = hs.mehsul_id
        WHERE (COALESCE(a.alis_miqdar, 0) > 0 OR COALESCE(s.satis_miqdar, 0) > 0)
        {2}
        ORDER BY toplam_qazanc DESC",
        start_date, end_date, category_filter
    );

    let mut stmt = db.conn.prepare(&query).map_err(|e| e.to_string())?;

    let items: Vec<ProductStatistics> = stmt
        .query_map([], |row| {
            Ok(ProductStatistics {
                mehsul_id: row.get(0)?,
                mehsul_adi: row.get(1)?,
                barkod: row.get(2)?,
                kateqoriya_id: row.get(3)?,
                kateqoriya_adi: row.get(4)?,
                toplam_alis_miqdar: row.get(5)?,
                toplam_satis_miqdar: row.get(6)?,
                toplam_alis_deyeri: row.get(7)?,
                toplam_satis_deyeri: row.get(8)?,
                ortalama_qazanc_vahid: row.get(9)?,
                toplam_qazanc: row.get(10)?,
                hazirki_stok: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Calculate totals
    let umumi_alis_miqdar: i32 = items.iter().map(|i| i.toplam_alis_miqdar).sum();
    let umumi_satis_miqdar: i32 = items.iter().map(|i| i.toplam_satis_miqdar).sum();
    let umumi_alis_deyeri: f64 = items.iter().map(|i| i.toplam_alis_deyeri).sum();
    let umumi_satis_deyeri: f64 = items.iter().map(|i| i.toplam_satis_deyeri).sum();
    let umumi_qazanc: f64 = items.iter().map(|i| i.toplam_qazanc).sum();

    let ortalama_qazanc_faizi = if umumi_alis_deyeri > 0.0 {
        (umumi_qazanc / umumi_alis_deyeri) * 100.0
    } else {
        0.0
    };

    Ok(ProductStatisticsReport {
        baslangic_tarix: start_date,
        bitis_tarix: end_date,
        items,
        umumi_alis_miqdar,
        umumi_satis_miqdar,
        umumi_alis_deyeri,
        umumi_satis_deyeri,
        umumi_qazanc,
        ortalama_qazanc_faizi,
    })
}

#[tauri::command]
pub async fn mehsul_hereketleri(
    state: State<'_, AppState>,
    mehsulId: i64,
    baslangicTarix: Option<String>,
    bitisTarix: Option<String>,
) -> Result<Vec<ProductMovementDetail>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut query = String::from(
        "SELECT
            sm.id,
            sm.created_at as tarix,
            sm.novu,
            sm.miqdar,
            sm.vahid_alis_qiymeti as vahid_qiymet,
            sm.toplam_deyeri,
            sm.qeyd
         FROM stock_movements sm
         WHERE sm.mehsul_id = ?"
    );

    if let Some(ref start) = baslangicTarix {
        query.push_str(&format!(" AND date(sm.created_at) >= '{}'", start));
    }

    if let Some(ref end) = bitisTarix {
        query.push_str(&format!(" AND date(sm.created_at) <= '{}'", end));
    }

    query.push_str(" ORDER BY sm.created_at DESC");

    let mut stmt = db.conn.prepare(&query).map_err(|e| e.to_string())?;

    let movements: Vec<ProductMovementDetail> = stmt
        .query_map([mehsulId], |row| {
            Ok(ProductMovementDetail {
                id: row.get(0)?,
                tarix: row.get(1)?,
                novu: row.get(2)?,
                miqdar: row.get(3)?,
                vahid_qiymet: row.get(4)?,
                toplam_deyeri: row.get(5)?,
                qeyd: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(movements)
}
