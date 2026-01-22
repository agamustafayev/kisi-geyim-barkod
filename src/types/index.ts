// Product Types
export interface Product {
  id: number;
  barkod: string;
  ad: string;
  kateqoriya_id: number | null;
  kateqoriya_adi: string | null;
  reng: string | null;
  marka: string | null;
  alis_qiymeti: number;
  satis_qiymeti: number;
  tesvir: string | null;
  sekil_yolu: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateProduct {
  barkod: string;
  ad: string;
  kateqoriya_id?: number | null;
  reng?: string | null;
  marka?: string | null;
  alis_qiymeti: number;
  satis_qiymeti: number;
  tesvir?: string | null;
  sekil_yolu?: string | null;
}

export interface UpdateProduct {
  barkod?: string;
  ad?: string;
  kateqoriya_id?: number | null;
  reng?: string | null;
  marka?: string | null;
  alis_qiymeti?: number;
  satis_qiymeti?: number;
  tesvir?: string | null;
  sekil_yolu?: string | null;
}

// Category Types
export interface Category {
  id: number;
  ad: string;
  created_at: string | null;
}

export interface CreateCategory {
  ad: string;
}

// Size Types
export interface Size {
  id: number;
  olcu: string;
  created_at: string | null;
}

export interface CreateSize {
  olcu: string;
}

// Color Types
export interface Color {
  id: number;
  ad: string;
  kod: string | null;
  created_at: string | null;
}

export interface CreateColor {
  ad: string;
  kod?: string | null;
}

// Stock Types
export interface Stock {
  id: number;
  mehsul_id: number;
  mehsul_adi: string | null;
  mehsul_barkod: string | null;
  kateqoriya_id: number | null;
  kateqoriya_adi: string | null;
  olcu_id: number;
  olcu: string | null;
  miqdar: number;
  minimum_miqdar: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateStock {
  mehsul_id: number;
  olcu_id: number;
  miqdar: number;
  minimum_miqdar?: number;
}

export interface UpdateStock {
  miqdar: number;
  minimum_miqdar?: number;
}

export interface StockInfo {
  olcu_id: number;
  olcu: string;
  miqdar: number;
  minimum_miqdar: number;
}

export interface LowStockAlert {
  mehsul_id: number;
  mehsul_adi: string;
  barkod: string;
  olcu: string;
  miqdar: number;
  minimum_miqdar: number;
}

// Customer Types
export interface Customer {
  id: number;
  ad: string;
  soyad: string;
  telefon: string;
  qeyd: string | null;
  baslangic_borcu: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomer {
  ad: string;
  soyad: string;
  telefon: string;
  qeyd?: string | null;
  baslangic_borcu?: number | null;
}

export interface UpdateCustomer {
  ad?: string;
  soyad?: string;
  telefon?: string;
  qeyd?: string | null;
}

export interface CustomerSaleItem {
  id: number;
  satis_nomresi: string;
  toplam_mebleg: number;
  endirim: number;
  son_mebleg: number;
  odenis_usulu: string;
  created_at: string;
}

// Sale Types
export interface Sale {
  id: number;
  satis_nomresi: string;
  musteri_id: number | null;
  musteri_adi: string | null;
  toplam_mebleg: number;
  endirim: number;
  son_mebleg: number;
  odenis_usulu: string;
  qeyd: string | null;
  created_at: string | null;
}

export interface CreateSale {
  items: CreateSaleItem[];
  endirim: number;
  odenis_usulu: string;
  musteri_id?: number | null;
  qeyd?: string | null;
}

export interface CreateSaleItem {
  mehsul_id: number;
  olcu_id: number;
  miqdar: number;
  vahid_qiymeti: number;
}

export interface SaleItem {
  id: number;
  satis_id: number;
  mehsul_id: number;
  mehsul_adi: string | null;
  mehsul_barkod: string | null;
  olcu_id: number;
  olcu: string | null;
  miqdar: number;
  vahid_qiymeti: number;
  toplam_qiymet: number;
  created_at: string | null;
  iade_miqdar: number;  // Qaytarılmış miqdar
}

// SaleWithItems - serde flatten olduğu üçün Sale fieldləri birbaşa root-dadır
export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

// Report Types
export interface StockValueReport {
  toplam_mehsul: number;
  toplam_stok: number;
  alis_deyeri: number;
  satis_deyeri: number;
  potensial_qazanc: number;
}

export interface DailySalesReport {
  tarix: string;
  satis_sayi: number;
  toplam_mebleg: number;
  endirim: number;
  net_mebleg: number;
}

export interface MonthlySalesReport {
  ay: string;
  satis_sayi: number;
  toplam_mebleg: number;
  endirim: number;
  net_mebleg: number;
}

export interface SaleListItem {
  id: number;
  satis_nomresi: string;
  toplam_mebleg: number;
  endirim: number;
  son_mebleg: number;
  odenis_usulu: string;
  qeyd: string | null;
  created_at: string;
  mehsul_sayi: number;
  iade_durumu: string;  // "Yoxdur", "Qismən", "Tam"
}

export interface ProfitReportItem {
  mehsul_id: number;
  mehsul_adi: string;
  barkod: string;
  olcu: string;
  miqdar: number;
  alis_qiymeti: number;
  satis_qiymeti: number;
  toplam_alis: number;
  toplam_satis: number;
  qazanc: number;
}

export interface ProfitReport {
  baslangic_tarix: string;
  bitis_tarix: string;
  items: ProfitReportItem[];
  toplam_alis: number;
  toplam_satis: number;
  toplam_qazanc: number;
  toplam_endirim: number;
  net_qazanc: number;
}

// Product Statistics Types
export interface ProductStatistics {
  mehsul_id: number;
  mehsul_adi: string;
  barkod: string;
  kateqoriya_id: number | null;
  kateqoriya_adi: string | null;
  toplam_alis_miqdar: number;
  toplam_satis_miqdar: number;
  toplam_alis_deyeri: number;
  toplam_satis_deyeri: number;
  ortalama_qazanc_vahid: number;
  toplam_qazanc: number;
  hazirki_stok: number;
}

export interface ProductStatisticsReport {
  baslangic_tarix: string;
  bitis_tarix: string;
  items: ProductStatistics[];
  umumi_alis_miqdar: number;
  umumi_satis_miqdar: number;
  umumi_alis_deyeri: number;
  umumi_satis_deyeri: number;
  umumi_qazanc: number;
  ortalama_qazanc_faizi: number;
}

export interface ProductMovementDetail {
  id: number;
  tarix: string;
  novu: string;
  miqdar: number;
  vahid_qiymet: number | null;
  toplam_deyeri: number | null;
  qeyd: string | null;
}

// Cart Types (Frontend only)
export interface CartItem {
  mehsul: Product;
  olcu_id: number;
  olcu: string;
  miqdar: number;
  vahid_qiymeti: number;
}

// Debt Payment Types
export interface DebtPayment {
  id: number;
  musteri_id: number;
  musteri_adi: string | null;
  mebleg: number;
  odenis_usulu: string;
  qeyd: string | null;
  created_at: string;
}

export interface CreateDebtPayment {
  musteri_id: number;
  mebleg: number;
  odenis_usulu: string;
  qeyd?: string | null;
}

export interface CustomerDebtSummary {
  musteri_id: number;
  musteri_adi: string;
  telefon: string;
  toplam_borc: number;
  toplam_odenis: number;
  qalan_borc: number;
}

// Return Types
export interface Return {
  id: number;
  iade_nomresi: string;
  satis_id: number;
  satis_nomresi: string | null;
  musteri_id: number | null;
  musteri_adi: string | null;
  toplam_mebleg: number;
  sebebi: string | null;
  qeyd: string | null;
  created_at: string;
}

export interface ReturnItem {
  id: number;
  iade_id: number;
  mehsul_id: number;
  mehsul_adi: string | null;
  mehsul_barkod: string | null;
  olcu_id: number;
  olcu: string | null;
  miqdar: number;
  vahid_qiymeti: number;
  toplam_qiymet: number;
  created_at: string | null;
}

export interface CreateReturn {
  satis_id: number;
  items: CreateReturnItem[];
  sebebi?: string | null;
  qeyd?: string | null;
}

export interface CreateReturnItem {
  mehsul_id: number;
  olcu_id: number;
  miqdar: number;
  vahid_qiymeti: number;
}

export interface ReturnWithItems extends Return {
  items: ReturnItem[];
}

// Settings Types
export interface Settings {
  id: number;
  magaza_adi: string;
  logo_yolu: string | null;
  telefon: string | null;
  adres: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tiktok: string | null;
  olculer_aktiv: boolean;
  qifil_sifresi: string | null;
  barkod_capinda_magaza_adi: boolean;
  updated_at: string | null;
}

export interface UpdateSettings {
  magaza_adi?: string | null;
  logo_yolu?: string | null;
  telefon?: string | null;
  adres?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  olculer_aktiv?: boolean | null;
  qifil_sifresi?: string | null;
  barkod_capinda_magaza_adi?: boolean | null;
}

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// User Types
export type UserRole = 'admin' | 'isci';

export interface User {
  id: number;
  ad: string;
  soyad: string;
  istifadeci_adi: string;
  rol: UserRole;
  aktiv: boolean;
  created_at: string | null;
}

export interface CreateUser {
  ad: string;
  soyad: string;
  istifadeci_adi: string;
  sifre: string;
  rol: UserRole;
}

export interface UpdateUser {
  ad?: string;
  soyad?: string;
  istifadeci_adi?: string;
  sifre?: string;
  rol?: UserRole;
  aktiv?: boolean;
}

export interface LoginRequest {
  istifadeci_adi: string;
  sifre: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}
