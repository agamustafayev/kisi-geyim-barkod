# Geyim Mağazası - Barkod və Stok Sistemi

Erkek giyim mağazası için offline çalışan barkod tabanlı stok ve satış yönetim sistemi.

## 🛠 Texnolojiyalar

- **Backend**: Rust + Tauri + SQLite
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Database**: SQLite (Offline, embedded)

## 📦 Quraşdırma

### Tələblər

- Node.js 18+
- Rust toolchain (rustup)
- Windows: Visual Studio Build Tools
- **Python 3.10+** (Print service üçün - sadəcə build zamanı)
- **wkhtmltopdf** (Yazdırma üçün - [İndir](https://wkhtmltopdf.org/downloads.html))

### Addımlar

```bash
# Dependencies quraşdır
npm install

# Development mode
npm run tauri dev

# Production build (Print service avtomatik build olunur)
npm run build:all

# Yalnız print service build (ilk dəfə)
npm run build:print-service
```

### Print Service Setup

**Quraşdırma addımları:**

1. **wkhtmltopdf quraşdırın:**
   - [wkhtmltopdf indir](https://wkhtmltopdf.org/downloads.html) (Windows 64-bit)
   - Installer'ı çalıştırın və sistem PATH'ə əlavə olunduğundan əmin olun
   - Terminal'da test edin: `wkhtmltopdf --version`

2. **Print service build:**
   ```bash
   npm run build:print-service
   ```
   - SumatraPDF avtomatik endiriləcək (~5MB)
   - İnternet bağlantısı lazımdır

3. **Tauri app build:**
   ```bash
   npm run build:all
   ```

**Not**: wkhtmltopdf sisteminizə quraşdırılmalıdır. Print service onu PATH-dən istifadə edəcək.

## 🚀 Xüsusiyyətlər

### Məhsul İdarəetmə
- ✅ Məhsul əlavə et / redaktə et / sil
- ✅ Barkod ilə axtarış
- ✅ Kateqoriya və marka idarəetmə
- ✅ Çoxsaylı ölçü dəstəyi

### Barkod Əməliyyatları
- ✅ Kablosuz barkod oxuyucu dəstəyi (HID mod)
- ✅ Avtomatik barkod yaratma
- ✅ Barkod ilə sürətli axtarış
- ✅ **Direkt barkod yazdırma** (Thermal printer dəstəyi)
- ✅ Toplu barkod çapı

### Stok İdarəetmə
- ✅ Ölçüyə görə stok izləmə
- ✅ Minimum stok xəbərdarlığı
- ✅ Stok hərəkətləri tarixi

### Satış
- ✅ Barkod oxuyaraq sürətli satış
- ✅ Səbət sistemi
- ✅ Endirim tətbiqi
- ✅ Nağd/Kart ödəniş
- ✅ **Satış çeki direkt yazdırma** (Thermal/A4 printer)

### Hesabatlar
- ✅ Günlük satış hesabatı
- ✅ Aylıq satış hesabatı
- ✅ Stok vəziyyəti hesabatı

## ⌨️ Klaviatura Qısayolları

| Düymə | Əməliyyat |
|-------|-----------|
| F1    | Məhsullar |
| F2    | Satışlar  |
| F3    | Stok      |
| F4    | Hesabatlar|

## 🖨️ Otomatik Yazdırma Sistemi

### Xüsusiyyətlər

- ✅ **Direkt Yazdırma**: Dialog olmadan avtomatik yazdırma
- ✅ **Thermal Printer Dəstəyi**: 80mm çek printerləri
- ✅ **Barkod Label Printer**: 50x30mm etiket yazdırma
- ✅ **HTML→PDF Konvertasiya**: wkhtmltopdf ilə
- ✅ **Background Service**: Python Flask (Port 9876)
- ✅ **Embedded Binary**: Tək executable, dependency yoxdur

### İstifadə

**Barkod Çapı:**
1. Məhsullar səhifəsində məhsulu seç
2. "Barkod Çap Et" düyməsinə bas
3. Yazıcını seç
4. "Direkt Yazdır" düyməsinə bas

**Satış Çeki:**
1. Satış tamamlandıqdan sonra çek modalı açılır
2. Yazıcını seç
3. "Direkt Yazdır" düyməsinə bas

### Troubleshooting

**Print service başlamıyor:**
- Port 9876 istifadədədirsə, başqa proqramı bağlayın

**Yazıcı bulunamıyor:**
- Yazıcı driver'larının quraşdırıldığını yoxlayın
- Windows Printer Settings-də yazıcının aktiv olduğunu təsdiqləyin

**Loglar:**
- Windows: `%APPDATA%/Geyim Barkod/print_service.log`

## 📁 Proje Strukturu

```
kisi-geyim-barkod/
├── src/                     # React Frontend
│   ├── components/
│   │   ├── barcode/        # Barkod komponentləri
│   │   ├── print/          # Print komponentləri (YENİ)
│   │   ├── receipt/        # Çek komponentləri
│   │   └── ui/             # UI komponentləri
│   ├── pages/              # Səhifələr
│   ├── hooks/              # Custom hooks
│   ├── services/           # API services (YENİ: printService)
│   ├── store/              # Zustand state
│   ├── lib/                # Utilities
│   └── types/              # TypeScript types
├── src-tauri/              # Rust Backend
│   ├── binaries/           # External binaries (YENİ: print-service)
│   └── src/
│       ├── db/             # Database modulu
│       ├── models/         # Data modellər
│       └── commands/       # Tauri commands (YENİ: printing)
├── print-service/          # Python Print Service (YENİ)
│   ├── print_service.py    # Flask server
│   ├── requirements.txt    # Python dependencies
│   ├── print_service.spec  # PyInstaller config
│   ├── build.bat           # Build script
│   └── resources/          # wkhtmltopdf, SumatraPDF
└── public/                 # Statik fayllar
```

## 📄 Lisenziya

MIT License
