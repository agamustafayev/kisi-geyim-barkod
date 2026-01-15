pub const SCHEMA: &str = r#"
-- Müştərilər (Müşteriler)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL,
    soyad TEXT NOT NULL,
    telefon TEXT NOT NULL UNIQUE,
    qeyd TEXT,
    baslangic_borcu REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Kateqoriyalar (Kategoriler)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ölçülər (Bedenler)
CREATE TABLE IF NOT EXISTS sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    olcu TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rənglər (Renkler)
CREATE TABLE IF NOT EXISTS colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL UNIQUE,
    kod TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Məhsullar (Ürünler)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barkod TEXT UNIQUE NOT NULL,
    ad TEXT NOT NULL,
    kateqoriya_id INTEGER,
    reng TEXT,
    marka TEXT,
    alis_qiymeti REAL NOT NULL,
    satis_qiymeti REAL NOT NULL,
    tesvir TEXT,
    sekil_yolu TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kateqoriya_id) REFERENCES categories(id)
);

-- Stok (Her ürün-ölçü kombinasyonu için)
CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mehsul_id INTEGER NOT NULL,
    olcu_id INTEGER NOT NULL,
    miqdar INTEGER DEFAULT 0,
    minimum_miqdar INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mehsul_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (olcu_id) REFERENCES sizes(id),
    UNIQUE(mehsul_id, olcu_id)
);

-- Satışlar
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satis_nomresi TEXT UNIQUE NOT NULL,
    musteri_id INTEGER,
    toplam_mebleg REAL NOT NULL,
    endirim REAL DEFAULT 0,
    son_mebleg REAL NOT NULL,
    odenis_usulu TEXT DEFAULT 'Nağd',
    qeyd TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (musteri_id) REFERENCES customers(id)
);

-- Satış Detalları
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satis_id INTEGER NOT NULL,
    mehsul_id INTEGER NOT NULL,
    olcu_id INTEGER NOT NULL,
    miqdar INTEGER NOT NULL,
    vahid_qiymeti REAL NOT NULL,
    toplam_qiymet REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (satis_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (mehsul_id) REFERENCES products(id),
    FOREIGN KEY (olcu_id) REFERENCES sizes(id)
);

-- Stok Hərəkətləri (Stok Hareketleri)
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mehsul_id INTEGER NOT NULL,
    olcu_id INTEGER NOT NULL,
    novu TEXT NOT NULL,
    miqdar INTEGER NOT NULL,
    evvelki_miqdar INTEGER,
    yeni_miqdar INTEGER,
    qeyd TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mehsul_id) REFERENCES products(id),
    FOREIGN KEY (olcu_id) REFERENCES sizes(id)
);

-- Nisyə Ödəmələri
CREATE TABLE IF NOT EXISTS debt_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    musteri_id INTEGER NOT NULL,
    mebleg REAL NOT NULL,
    odenis_usulu TEXT DEFAULT 'Nağd',
    qeyd TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (musteri_id) REFERENCES customers(id)
);

-- Geri Qaytarmalər (Geri Qaytarmalar)
CREATE TABLE IF NOT EXISTS returns (
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
);

-- Geri Qaytarma Detalları
CREATE TABLE IF NOT EXISTS return_items (
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
);

-- İndexlər (Performans üçün)
CREATE INDEX IF NOT EXISTS idx_products_barkod ON products(barkod);
CREATE INDEX IF NOT EXISTS idx_stock_mehsul ON stock(mehsul_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_satis ON sale_items(satis_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_musteri ON debt_payments(musteri_id);
CREATE INDEX IF NOT EXISTS idx_returns_satis ON returns(satis_id);

-- Mağaza Parametrləri
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    magaza_adi TEXT DEFAULT 'Geyim',
    logo_yolu TEXT,
    telefon TEXT,
    adres TEXT,
    whatsapp TEXT,
    instagram TEXT,
    tiktok TEXT,
    olculer_aktiv INTEGER DEFAULT 1,
    qifil_sifresi TEXT,
    barkod_capinda_magaza_adi INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings insert
INSERT OR IGNORE INTO settings (id, magaza_adi) VALUES (1, 'Geyim');

-- Default kateqoriyalar (UNIQUE constraint sayəsində dublikat əlavə olmayacaq)
INSERT OR IGNORE INTO categories (ad) VALUES
    ('Şalvar'),
    ('Köynək'),
    ('Ayaqabı'),
    ('Kostyum'),
    ('Aksesuar');

-- Default rənglər
INSERT OR IGNORE INTO colors (ad, kod) VALUES
    ('Qara', '#000000'),
    ('Ağ', '#FFFFFF'),
    ('Qırmızı', '#FF0000'),
    ('Göy', '#0000FF'),
    ('Yaşıl', '#008000'),
    ('Sarı', '#FFFF00'),
    ('Narıncı', '#FFA500'),
    ('Bənövşəyi', '#800080'),
    ('Çəhrayı', '#FFC0CB'),
    ('Boz', '#808080');
"#;
