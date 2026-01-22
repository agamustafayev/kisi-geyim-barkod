import { invoke } from '@tauri-apps/api/tauri';
import type {
  Product,
  CreateProduct,
  UpdateProduct,
  Category,
  CreateCategory,
  Size,
  CreateSize,
  Color,
  CreateColor,
  Stock,
  CreateStock,
  UpdateStock,
  Sale,
  CreateSale,
  SaleWithItems,
  StockValueReport,
  DailySalesReport,
  MonthlySalesReport,
  LowStockAlert,
  SaleListItem,
  ProfitReport,
  ProductStatisticsReport,
  ProductMovementDetail,
  Customer,
  CreateCustomer,
  UpdateCustomer,
  CustomerSaleItem,
  DebtPayment,
  CreateDebtPayment,
  CustomerDebtSummary,
  Return,
  CreateReturn,
  ReturnWithItems,
  Settings,
  UpdateSettings,
  User,
  CreateUser,
  UpdateUser,
  LoginRequest,
  LoginResponse,
} from '@/types';

// Product API
export const productApi = {
  mehsulElaveEt: (mehsul: CreateProduct): Promise<Product> =>
    invoke('mehsul_elave_et', { mehsul }),

  mehsulSiyahisi: (): Promise<Product[]> =>
    invoke('mehsul_siyahisi'),

  mehsulAxtar: (axtaris: string): Promise<Product[]> =>
    invoke('mehsul_axtar', { axtaris }),

  mehsulBarkodIleAxtar: (barkod: string): Promise<Product | null> =>
    invoke('mehsul_barkod_ile_axtar', { barkod }),

  mehsulYenile: (id: number, mehsul: UpdateProduct): Promise<Product> =>
    invoke('mehsul_yenile', { id, mehsul }),

  mehsulSil: (id: number): Promise<void> =>
    invoke('mehsul_sil', { id }),
};

// Category API
export const categoryApi = {
  kateqoriyaElaveEt: (kateqoriya: CreateCategory): Promise<Category> =>
    invoke('kateqoriya_elave_et', { kateqoriya }),

  kateqoriyaSiyahisi: (): Promise<Category[]> =>
    invoke('kateqoriya_siyahisi'),

  kateqoriyaYenile: (id: number, ad: string): Promise<Category> =>
    invoke('kateqoriya_yenile', { id, ad }),

  kateqoriyaSil: (id: number): Promise<void> =>
    invoke('kateqoriya_sil', { id }),
};

// Size API
export const sizeApi = {
  olcuElaveEt: (olcu: CreateSize): Promise<Size> =>
    invoke('olcu_elave_et', { olcu }),

  olcuSiyahisi: (): Promise<Size[]> =>
    invoke('olcu_siyahisi'),

  olcuYenile: (id: number, olcu: string): Promise<Size> =>
    invoke('olcu_yenile', { id, olcu }),

  olcuSil: (id: number): Promise<void> =>
    invoke('olcu_sil', { id }),
};

// Stock API
export const stockApi = {
  stokElaveEt: (stok: CreateStock): Promise<Stock> =>
    invoke('stok_elave_et', { stok }),

  stokYenile: (mehsulId: number, olcuId: number, stok: UpdateStock): Promise<Stock> =>
    invoke('stok_yenile', { mehsulId, olcuId, stok }),

  stokSiyahisi: (): Promise<Stock[]> =>
    invoke('stok_siyahisi'),

  stokMehsulUcun: (mehsulId: number): Promise<Stock[]> =>
    invoke('stok_mehsul_ucun', { mehsulId }),

  stokSil: (mehsulId: number, olcuId: number): Promise<void> =>
    invoke('stok_sil', { mehsulId, olcuId }),
};

// Sale API
export const saleApi = {
  satisYarat: (satis: CreateSale): Promise<Sale> =>
    invoke('satis_yarat', { satis }),

  satisSiyahisi: (): Promise<Sale[]> =>
    invoke('satis_siyahisi'),

  satisDetallari: (satisId: number): Promise<SaleWithItems> =>
    invoke('satis_detallari', { satisId }),
};

// Customer API
export const customerApi = {
  musteriElaveEt: (musteri: CreateCustomer): Promise<Customer> =>
    invoke('musteri_elave_et', { musteri }),

  musteriSiyahisi: (): Promise<Customer[]> =>
    invoke('musteri_siyahisi'),

  musteriAxtar: (axtaris: string): Promise<Customer[]> =>
    invoke('musteri_axtar', { axtaris }),

  musteriYenile: (id: number, musteri: UpdateCustomer): Promise<Customer> =>
    invoke('musteri_yenile', { id, musteri }),

  musteriSil: (id: number): Promise<void> =>
    invoke('musteri_sil', { id }),

  musteriNisyeBorclari: (musteriId: number): Promise<number> =>
    invoke('musteri_nisye_borclari', { musteriId }),

  musteriSatisKecmisi: (musteriId: number): Promise<CustomerSaleItem[]> =>
    invoke('musteri_satis_kecmisi', { musteriId }),
};

// Report API
export const reportApi = {
  gunlukSatisHesabati: (tarix?: string): Promise<DailySalesReport> =>
    invoke('gunluk_satis_hesabati', { tarix }),

  ayliqSatisHesabati: (ay?: string): Promise<MonthlySalesReport> =>
    invoke('ayliq_satis_hesabati', { ay }),

  stokHesabati: (): Promise<LowStockAlert[]> =>
    invoke('stok_hesabati'),

  satisSiyahisiTarixeGore: (baslangicTarix?: string, bitisTarix?: string): Promise<SaleListItem[]> =>
    invoke('satis_siyahisi_tarixe_gore', { baslangicTarix, bitisTarix }),

  qazancHesabati: (baslangicTarix?: string, bitisTarix?: string): Promise<ProfitReport> =>
    invoke('qazanc_hesabati', { baslangicTarix, bitisTarix }),

  stokDeyeriHesabati: (): Promise<StockValueReport> =>
    invoke('stok_deyeri_hesabati'),

  mehsulStatistikasi: (baslangicTarix?: string, bitisTarix?: string, kateqoriyaId?: number): Promise<ProductStatisticsReport> =>
    invoke('mehsul_statistikasi', { baslangicTarix, bitisTarix, kateqoriyaId }),

  mehsulHereketleri: (mehsulId: number, baslangicTarix?: string, bitisTarix?: string): Promise<ProductMovementDetail[]> =>
    invoke('mehsul_hereketleri', { mehsulId, baslangicTarix, bitisTarix }),
};

// Payment API
export const paymentApi = {
  borcOdemeYarat: (odeme: CreateDebtPayment): Promise<DebtPayment> =>
    invoke('borc_odeme_yarat', { odeme }),

  borcOdemeSiyahisi: (): Promise<DebtPayment[]> =>
    invoke('borc_odeme_siyahisi'),

  musteriBorcXulasesi: (): Promise<CustomerDebtSummary[]> =>
    invoke('musteri_borc_xulasesi'),

  musteriOdemeKecmisi: (musteriId: number): Promise<DebtPayment[]> =>
    invoke('musteri_odeme_kecmisi', { musteriId }),
};

// Return API
export const returnApi = {
  iadeYarat: (iade: CreateReturn): Promise<Return> =>
    invoke('iade_yarat', { iade }),

  iadeSiyahisi: (): Promise<Return[]> =>
    invoke('iade_siyahisi'),

  iadeDetallari: (iadeId: number): Promise<ReturnWithItems> =>
    invoke('iade_detallari', { iadeId }),
};

// Settings API
export const settingsApi = {
  parametrleriAl: (): Promise<Settings> =>
    invoke('parametrleri_al'),

  parametrleriYenile: (settings: UpdateSettings): Promise<Settings> =>
    invoke('parametrleri_yenile', { settings }),
};

// User API
export const userApi = {
  girisYap: (login: LoginRequest): Promise<LoginResponse> =>
    invoke('giris_yap', { login }),

  istifadeciElaveEt: (user: CreateUser): Promise<User> =>
    invoke('istifadeci_elave_et', { user }),

  istifadeciSiyahisi: (): Promise<User[]> =>
    invoke('istifadeci_siyahisi'),

  istifadeciYenile: (id: number, user: UpdateUser): Promise<User> =>
    invoke('istifadeci_yenile', { id, user }),

  istifadeciSil: (id: number): Promise<void> =>
    invoke('istifadeci_sil', { id }),

  sifreDeyis: (id: number, kohneSifre: string, yeniSifre: string): Promise<void> =>
    invoke('sifre_deyis', { id, kohneSifre, yeniSifre }),
};

// Database API
export const databaseApi = {
  databaziSifirla: (): Promise<void> =>
    invoke('databazi_sifirla'),
};

// Printer API
export const printerApi = {
  printerleriAl: (): Promise<Array<{ id: string; name: string }>> =>
    invoke('printerleri_al'),
};

// Color API
export const colorApi = {
  rengElaveEt: (reng: CreateColor): Promise<Color> =>
    invoke('reng_elave_et', { reng }),

  rengSiyahisi: (): Promise<Color[]> =>
    invoke('reng_siyahisi'),

  rengYenile: (id: number, ad: string, kod: string | null): Promise<Color> =>
    invoke('reng_yenile', { id, ad, kod }),

  rengSil: (id: number): Promise<void> =>
    invoke('reng_sil', { id }),
};
