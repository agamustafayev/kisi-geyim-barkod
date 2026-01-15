// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod models;
mod commands;

use std::sync::{Arc, Mutex};
use db::connection::Database;

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
}

fn main() {
    // Initialize database
    let db = Database::new().expect("Database bağlantısı qurula bilmədi");

    // Run migrations
    db.init_schema().expect("Database schema yaradıla bilmədi");

    let state = AppState {
        db: Arc::new(Mutex::new(db)),
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            // Product commands
            commands::product::mehsul_elave_et,
            commands::product::mehsul_siyahisi,
            commands::product::mehsul_axtar,
            commands::product::mehsul_yenile,
            commands::product::mehsul_sil,
            commands::product::mehsul_barkod_ile_axtar,
            // Category commands
            commands::category::kateqoriya_elave_et,
            commands::category::kateqoriya_siyahisi,
            commands::category::kateqoriya_yenile,
            commands::category::kateqoriya_sil,
            // Size commands
            commands::size::olcu_elave_et,
            commands::size::olcu_siyahisi,
            commands::size::olcu_yenile,
            commands::size::olcu_sil,
            // Color commands
            commands::color::reng_elave_et,
            commands::color::reng_siyahisi,
            commands::color::reng_yenile,
            commands::color::reng_sil,
            // Stock commands
            commands::stock::stok_elave_et,
            commands::stock::stok_yenile,
            commands::stock::stok_siyahisi,
            commands::stock::stok_mehsul_ucun,
            commands::stock::stok_sil,
            // Sale commands
            commands::sale::satis_yarat,
            commands::sale::satis_siyahisi,
            commands::sale::satis_detallari,
            // Report commands
            commands::report::gunluk_satis_hesabati,
            commands::report::ayliq_satis_hesabati,
            commands::report::stok_hesabati,
            commands::report::satis_siyahisi_tarixe_gore,
            commands::report::qazanc_hesabati,
            commands::report::stok_deyeri_hesabati,
            // Customer commands
            commands::customer::musteri_elave_et,
            commands::customer::musteri_siyahisi,
            commands::customer::musteri_axtar,
            commands::customer::musteri_yenile,
            commands::customer::musteri_sil,
            commands::customer::musteri_nisye_borclari,
            commands::customer::musteri_satis_kecmisi,
            // Payment commands
            commands::payment::borc_odeme_yarat,
            commands::payment::borc_odeme_siyahisi,
            commands::payment::musteri_borc_xulasesi,
            commands::payment::musteri_odeme_kecmisi,
            // Return commands
            commands::returns::iade_yarat,
            commands::returns::iade_siyahisi,
            commands::returns::iade_detallari,
            // Settings commands
            commands::settings::parametrleri_al,
            commands::settings::parametrleri_yenile,
            // User commands
            commands::user::giris_yap,
            commands::user::istifadeci_elave_et,
            commands::user::istifadeci_siyahisi,
            commands::user::istifadeci_yenile,
            commands::user::istifadeci_sil,
            commands::user::sifre_deyis,
            // Database commands
            commands::database::databazi_sifirla,
        ])
        .run(tauri::generate_context!())
        .expect("Tətbiq işə salına bilmədi");
}
