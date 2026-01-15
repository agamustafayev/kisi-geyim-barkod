use rusqlite::{Connection, Result};
use std::path::PathBuf;

pub struct Database {
    pub conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = Self::get_db_path();
        
        // Create parent directories if they don't exist
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }
        
        let conn = Connection::open(&db_path)?;
        
        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        
        Ok(Database { conn })
    }
    
    fn get_db_path() -> PathBuf {
        // Get app data directory
        let mut path = dirs_next::data_dir()
            .unwrap_or_else(|| PathBuf::from("."));
        path.push("kisi-geyim-barkod");
        path.push("database.db");
        path
    }
    
    pub fn init_schema(&self) -> Result<()> {
        self.conn.execute_batch(super::schema::SCHEMA)?;
        self.run_migrations()?;
        self.seed_default_data()?;
        Ok(())
    }
    
    fn run_migrations(&self) -> Result<()> {
        // Migration 1: Add customers table if not exists
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ad TEXT NOT NULL,
                soyad TEXT NOT NULL,
                telefon TEXT NOT NULL UNIQUE,
                qeyd TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // Migration 2: Add musteri_id column to sales if not exists
        let has_musteri_id: bool = self.conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('sales') WHERE name='musteri_id'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        ).unwrap_or(false);
        
        if !has_musteri_id {
            self.conn.execute(
                "ALTER TABLE sales ADD COLUMN musteri_id INTEGER REFERENCES customers(id)",
                [],
            )?;
        }
        
        // Migration 3: Add debt_payments table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS debt_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                musteri_id INTEGER NOT NULL,
                mebleg REAL NOT NULL,
                odenis_usulu TEXT DEFAULT 'Nağd',
                qeyd TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (musteri_id) REFERENCES customers(id)
            )",
            [],
        )?;
        
        // Migration 4: Add returns table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS returns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                iade_nomresi TEXT UNIQUE NOT NULL,
                satis_id INTEGER NOT NULL,
                musteri_id INTEGER,
                toplam_mebleg REAL NOT NULL,
                sebebi TEXT,
                qeyd TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (satis_id) REFERENCES sales(id),
                FOREIGN KEY (musteri_id) REFERENCES customers(id)
            )",
            [],
        )?;
        
        // Migration 5: Add return_items table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS return_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                iade_id INTEGER NOT NULL,
                mehsul_id INTEGER NOT NULL,
                olcu_id INTEGER NOT NULL,
                miqdar INTEGER NOT NULL,
                vahid_qiymeti REAL NOT NULL,
                toplam_qiymet REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (iade_id) REFERENCES returns(id) ON DELETE CASCADE,
                FOREIGN KEY (mehsul_id) REFERENCES products(id),
                FOREIGN KEY (olcu_id) REFERENCES sizes(id)
            )",
            [],
        )?;

        // Migration 6: Add settings table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                magaza_adi TEXT DEFAULT 'Geyim',
                logo_yolu TEXT,
                telefon TEXT,
                adres TEXT,
                whatsapp TEXT,
                instagram TEXT,
                tiktok TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // Insert default settings if not exists
        self.conn.execute(
            "INSERT OR IGNORE INTO settings (id, magaza_adi) VALUES (1, 'Geyim')",
            [],
        )?;
        
        // Migration 7: Add users table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ad TEXT NOT NULL,
                soyad TEXT NOT NULL,
                istifadeci_adi TEXT UNIQUE NOT NULL,
                sifre TEXT NOT NULL,
                rol TEXT NOT NULL DEFAULT 'isci',
                aktiv INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // Insert default admin user if not exists (password: admin123)
        self.conn.execute(
            "INSERT OR IGNORE INTO users (id, ad, soyad, istifadeci_adi, sifre, rol) 
             VALUES (1, 'Admin', 'İstifadəçi', 'admin', 'admin123', 'admin')",
            [],
        )?;
        
        // Migration 8: Add missing sizes
        let missing_sizes = ["XXXL", "39", "41", "43", "45", "47", "49"];
        for size in missing_sizes {
            self.conn.execute(
                "INSERT OR IGNORE INTO sizes (olcu) VALUES (?1)",
                [size],
            )?;
        }
        
        // Migration 9: Add baslangic_borcu column to customers table
        let has_baslangic_borcu: bool = self.conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('customers') WHERE name='baslangic_borcu'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        ).unwrap_or(false);
        
        if !has_baslangic_borcu {
            self.conn.execute(
                "ALTER TABLE customers ADD COLUMN baslangic_borcu REAL DEFAULT 0",
                [],
            )?;
        }
        
        // Migration 10: Add olculer_aktiv column to settings table
        let has_olculer_aktiv: bool = self.conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('settings') WHERE name='olculer_aktiv'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        ).unwrap_or(false);
        
        if !has_olculer_aktiv {
            self.conn.execute(
                "ALTER TABLE settings ADD COLUMN olculer_aktiv INTEGER DEFAULT 1",
                [],
            )?;
        }
        
        // Migration 11: Add qifil_sifresi column to settings table
        let has_qifil_sifresi: bool = self.conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('settings') WHERE name='qifil_sifresi'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        ).unwrap_or(false);
        
        if !has_qifil_sifresi {
            self.conn.execute(
                "ALTER TABLE settings ADD COLUMN qifil_sifresi TEXT",
                [],
            )?;
        }
        
        // Migration 12: Add barkod_capinda_magaza_adi column to settings table
        let has_barkod_capinda_magaza_adi: bool = self.conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('settings') WHERE name='barkod_capinda_magaza_adi'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        ).unwrap_or(false);

        if !has_barkod_capinda_magaza_adi {
            self.conn.execute(
                "ALTER TABLE settings ADD COLUMN barkod_capinda_magaza_adi INTEGER DEFAULT 0",
                [],
            )?;
        }

        // Migration 13: Add varsayilan_barkod_yazici column to settings table
        let has_varsayilan_barkod_yazici: bool = self.conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('settings') WHERE name='varsayilan_barkod_yazici'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        ).unwrap_or(false);

        if !has_varsayilan_barkod_yazici {
            self.conn.execute(
                "ALTER TABLE settings ADD COLUMN varsayilan_barkod_yazici TEXT",
                [],
            )?;
        }

        // Migration 14: Add varsayilan_makbuz_yazici column to settings table
        let has_varsayilan_makbuz_yazici: bool = self.conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('settings') WHERE name='varsayilan_makbuz_yazici'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        ).unwrap_or(false);

        if !has_varsayilan_makbuz_yazici {
            self.conn.execute(
                "ALTER TABLE settings ADD COLUMN varsayilan_makbuz_yazici TEXT",
                [],
            )?;
        }

        Ok(())
    }
    
    fn seed_default_data(&self) -> Result<()> {
        // Add default sizes (INSERT OR IGNORE to avoid duplicates)
        let sizes = [
            "XS", "S", "M", "L", "XL", "XXL", "XXXL",
            "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50"
        ];
        for size in sizes {
            self.conn.execute(
                "INSERT OR IGNORE INTO sizes (olcu) VALUES (?1)",
                [size],
            )?;
        }
        
        // Add default categories (INSERT OR IGNORE to avoid duplicates)
        let categories = ["Şalvar", "Köynək", "Ayaqabı", "Kostyum", "Aksesuar"];
        for category in categories {
            self.conn.execute(
                "INSERT OR IGNORE INTO categories (ad) VALUES (?1)",
                [category],
            )?;
        }
        
        Ok(())
    }
}
