import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Select, Modal, Table } from '@/components/ui';
import { BarcodePrintModal } from '@/components/barcode';
import { useProducts, useBarkodOxucu } from '@/hooks';
import { useAppStore } from '@/store/appStore';
import { stockApi } from '@/lib/tauri';
import { formatCurrency, generateBarcode, sortSizes } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit,
  Trash2,
  Barcode,
  RefreshCw,
  Search,
  Package,
  Printer,
  MoreVertical,
  Filter,
  X,
} from 'lucide-react';
import type { Product, CreateProduct, Stock } from '@/types';

const productSchema = z.object({
  barkod: z.string().min(6, 'Barkod ən azı 6 simvol olmalıdır'),
  ad: z.string().min(2, 'Məhsulun adı ən azı 2 simvol olmalıdır'),
  kateqoriya_id: z.number().optional().nullable(),
  reng: z.string().optional().nullable(),
  marka: z.string().optional().nullable(),
  alis_qiymeti: z.number().positive('Alış qiyməti müsbət olmalıdır'),
  satis_qiymeti: z.number().positive('Satış qiyməti müsbət olmalıdır'),
  tesvir: z.string().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Stock entry for each size
interface StockEntry {
  olcu_id: number;
  olcu: string;
  miqdar: number;
}

export const Products: React.FC = () => {
  const { products, categories, sizes, colors, createProduct, editProduct, deleteProduct, searchProducts, loadData } = useProducts();
  const { loading, addToast, isAdmin } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [barcodePrintProduct, setBarcodePrintProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Stock entries state
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [productStocks, setProductStocks] = useState<{ [key: number]: number }>({});
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      barkod: '',
      ad: '',
      kateqoriya_id: null,
      reng: '',
      marka: '',
      alis_qiymeti: 0,
      satis_qiymeti: 0,
      tesvir: '',
    },
  });

  // Initialize stock entries when sizes change or modal opens
  useEffect(() => {
    if (sizes.length > 0 && isModalOpen) {
      initializeStockEntries();
    }
  }, [sizes, isModalOpen]);

  const initializeStockEntries = () => {
    // Sort sizes: letters first (XS, S, M, L, XL, XXL, XXXL), then numbers (38, 40, 42...)
    const sortedSizes = sortSizes(sizes);
    
    const entries: StockEntry[] = sortedSizes.map((size) => ({
      olcu_id: size.id,
      olcu: size.olcu,
      miqdar: 0,
    }));
    setStockEntries(entries);
  };

  // Load existing stock when editing
  const loadProductStock = async (productId: number) => {
    setLoadingStock(true);
    try {
      const stocks = await stockApi.stokMehsulUcun(productId);
      
      // Update stock entries with existing values
      setStockEntries((prev) =>
        prev.map((entry) => {
          const existingStock = stocks.find((s) => s.olcu_id === entry.olcu_id);
          return existingStock
            ? { ...entry, miqdar: existingStock.miqdar }
            : entry;
        })
      );
    } catch (error) {
      console.error('Error loading stock:', error);
    } finally {
      setLoadingStock(false);
    }
  };

  // Handle barcode scan
  useBarkodOxucu({
    onScan: (barkod) => {
      if (isModalOpen) {
        setValue('barkod', barkod);
      } else {
        setSearchQuery(barkod);
        searchProducts(barkod);
      }
    },
    enabled: true,
  });

  // Load stock totals for all products
  const loadProductStocks = async () => {
    try {
      const allStocks = await stockApi.stokSiyahisi();
      const stockTotals: { [key: number]: number } = {};

      allStocks.forEach((stock) => {
        if (!stockTotals[stock.mehsul_id]) {
          stockTotals[stock.mehsul_id] = 0;
        }
        stockTotals[stock.mehsul_id] += stock.miqdar;
      });

      setProductStocks(stockTotals);
    } catch (error) {
      console.error('Error loading product stocks:', error);
    }
  };

  // Load stocks when products change
  useEffect(() => {
    if (products.length > 0) {
      loadProductStocks();
    }
  }, [products]);

  // Filter products based on search, category, and color
  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategory !== null && product.kateqoriya_id !== selectedCategory) {
      return false;
    }

    // Color filter
    if (selectedColor && product.reng !== selectedColor) {
      return false;
    }

    return true;
  });

  // Search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery);
      } else {
        loadData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      barkod: generateBarcode(),
      ad: '',
      kateqoriya_id: null,
      reng: '',
      marka: '',
      alis_qiymeti: 0,
      satis_qiymeti: 0,
      tesvir: '',
    });
    initializeStockEntries();
    setIsModalOpen(true);
  };

  const openEditModal = async (product: Product) => {
    setEditingProduct(product);
    reset({
      barkod: product.barkod,
      ad: product.ad,
      kateqoriya_id: product.kateqoriya_id,
      reng: product.reng || '',
      marka: product.marka || '',
      alis_qiymeti: product.alis_qiymeti,
      satis_qiymeti: product.satis_qiymeti,
      tesvir: product.tesvir || '',
    });
    initializeStockEntries();
    setIsModalOpen(true);
    
    // Load existing stock for this product
    await loadProductStock(product.id);
  };

  const handleStockChange = (olcuId: number, value: number) => {
    setStockEntries((prev) =>
      prev.map((entry) =>
        entry.olcu_id === olcuId ? { ...entry, miqdar: value } : entry
      )
    );
  };

  const saveStockEntries = async (productId: number) => {
    // Get existing stocks for this product
    let existingStocks: Stock[] = [];
    try {
      existingStocks = await stockApi.stokMehsulUcun(productId);
    } catch (error) {
      // Product might be new, no existing stocks
    }

    for (const entry of stockEntries) {
      // Check if this size already has stock entry
      const existingStock = existingStocks.find(s => s.olcu_id === entry.olcu_id);
      
      // If stock exists, update it (even if 0)
      // If stock doesn't exist, only add if quantity > 0
      if (existingStock || entry.miqdar > 0) {
        try {
          await stockApi.stokYenile(productId, entry.olcu_id, {
            miqdar: entry.miqdar,
            minimum_miqdar: 1,
          });
        } catch (error) {
          console.error(`Error saving stock for size ${entry.olcu}:`, error);
          addToast('error', `Stok xətası: ${entry.olcu} - ${error}`);
        }
      }
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const productData: CreateProduct = {
        ...data,
        kateqoriya_id: data.kateqoriya_id || null,
        reng: data.reng || null,
        marka: data.marka || null,
        tesvir: data.tesvir || null,
      };

      if (editingProduct) {
        await editProduct(editingProduct.id, productData);
        await saveStockEntries(editingProduct.id);
      } else {
        const newProduct = await createProduct(productData);
        await saveStockEntries(newProduct.id);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteProduct(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  // Calculate total stock for display
  const getTotalStock = () => {
    return stockEntries.reduce((sum, entry) => sum + entry.miqdar, 0);
  };

  // Build columns based on user role
  const baseColumns = [
    {
      key: 'barkod',
      header: 'Barkod',
      render: (product: Product) => (
        <span className="font-mono text-sm">{product.barkod}</span>
      ),
    },
    { key: 'ad', header: 'Məhsul Adı' },
    {
      key: 'kateqoriya_adi',
      header: 'Kateqoriya',
      render: (product: Product) => product.kateqoriya_adi || '-',
    },
    {
      key: 'marka',
      header: 'Marka',
      render: (product: Product) => product.marka || '-',
    },
    {
      key: 'reng',
      header: 'Rəng',
      render: (product: Product) => {
        if (!product.reng) return '-';
        const color = colors.find(c => c.ad === product.reng);
        return (
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: color?.kod || '#e5e7eb' }}
            />
            <span>{product.reng}</span>
          </div>
        );
      },
    },
  ];

  // Stock and price columns
  const priceColumns = isAdmin()
    ? [
        {
          key: 'stok',
          header: 'Stokda',
          render: (product: Product) => {
            const totalStock = productStocks[product.id] || 0;
            return (
              <span className={`font-semibold ${totalStock === 0 ? 'text-red-600' : totalStock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                {totalStock} ədəd
              </span>
            );
          },
        },
        {
          key: 'satis_qiymeti',
          header: 'Satış Qiyməti',
          render: (product: Product) => (
            <span className="font-semibold text-primary-600">
              {formatCurrency(product.satis_qiymeti)}
            </span>
          ),
        },
      ]
    : [
        {
          key: 'stok',
          header: 'Stokda',
          render: (product: Product) => {
            const totalStock = productStocks[product.id] || 0;
            return (
              <span className={`font-semibold ${totalStock === 0 ? 'text-red-600' : totalStock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                {totalStock} ədəd
              </span>
            );
          },
        },
        {
          key: 'satis_qiymeti',
          header: 'Qiymət',
          render: (product: Product) => (
            <span className="font-semibold text-primary-600">
              {formatCurrency(product.satis_qiymeti)}
            </span>
          ),
        },
      ];

  const columns = [
    ...baseColumns,
    ...priceColumns,
    {
      key: 'actions',
      header: '',
      render: (product: Product) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(openDropdown === product.id ? null : product.id);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {openDropdown === product.id && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenDropdown(null)}
              />

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBarcodePrintProduct(product);
                    setOpenDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                >
                  <Printer className="w-4 h-4 text-gray-600" />
                  Barkod Çap Et
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(product);
                    setOpenDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                  Redaktə Et
                </button>

                <div className="border-t border-gray-100 my-1" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(product);
                    setOpenDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Sil
                </button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="Məhsullar"
        searchPlaceholder="Barkod, ad və ya marka ilə axtar..."
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Input
                placeholder="Axtar..."
                icon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => loadData()}
            >
              Yenilə
            </Button>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={openAddModal}
          >
            Yeni Məhsul
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filterlər:</span>
            </div>

            {/* Category Filter */}
            <div className="w-48">
              <Select
                value={selectedCategory?.toString() || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Bütün Kateqoriyalar</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.ad}
                  </option>
                ))}
              </Select>
            </div>

            {/* Color Filter */}
            <div className="w-52">
              <div className="relative">
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Bütün Rənglər</option>
                  {colors.map((color) => (
                    <option key={color.id} value={color.ad}>
                      {color.ad}
                    </option>
                  ))}
                </select>
                {selectedColor && (
                  <div
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: colors.find(c => c.ad === selectedColor)?.kod || '#e5e7eb' }}
                  />
                )}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategory !== null || selectedColor) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedColor('');
                }}
                className="ml-auto flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Filterləri Təmizlə
              </button>
            )}
          </div>

          {/* Active Filters */}
          {(selectedCategory !== null || selectedColor) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">Aktiv filterlər:</span>
              {selectedCategory !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  {categories.find(c => c.id === selectedCategory)?.ad}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="hover:bg-primary-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedColor && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: colors.find(c => c.ad === selectedColor)?.kod || '#e5e7eb' }}
                  />
                  {selectedColor}
                  <button
                    onClick={() => setSelectedColor('')}
                    className="hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Products Table */}
        <Table
          columns={columns}
          data={filteredProducts}
          keyExtractor={(p) => p.id}
          loading={loading}
          emptyMessage="Məhsul tapılmadı"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Məhsulu Redaktə Et' : 'Yeni Məhsul Əlavə Et'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Info Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Barcode className="w-4 h-4" />
              Məhsul Məlumatları
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex gap-2">
                <div className="flex-1">
                  <Input
                    label="Barkod Nömrəsi"
                    icon={<Barcode className="w-4 h-4" />}
                    {...register('barkod')}
                    error={errors.barkod?.message}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-7"
                  onClick={() => setValue('barkod', generateBarcode())}
                >
                  Yarat
                </Button>
              </div>

              <div className="col-span-2">
                <Input
                  label="Məhsulun Adı"
                  {...register('ad')}
                  error={errors.ad?.message}
                />
              </div>

              <Select
                label="Kateqoriya"
                options={categories.map((c) => ({ value: c.id, label: c.ad }))}
                placeholder="Seçin..."
                {...register('kateqoriya_id', { valueAsNumber: true })}
              />

              <Input label="Marka" {...register('marka')} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Rəng
                </label>
                <div className="relative">
                  <select
                    {...register('reng')}
                    className="w-full h-10 pl-8 pr-8 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Seçin...</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.ad}>
                        {c.ad}
                      </option>
                    ))}
                  </select>
                  <div
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: colors.find(c => c.ad === watch('reng'))?.kod || '#e5e7eb' }}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Only admin can see/edit purchase price */}
              {isAdmin() ? (
                <>
                  <Input
                    label="Alış Qiyməti (₼)"
                    type="number"
                    step="0.01"
                    {...register('alis_qiymeti', { valueAsNumber: true })}
                    error={errors.alis_qiymeti?.message}
                  />

                  <Input
                    label="Satış Qiyməti (₼)"
                    type="number"
                    step="0.01"
                    {...register('satis_qiymeti', { valueAsNumber: true })}
                    error={errors.satis_qiymeti?.message}
                  />
                </>
              ) : (
                <div className="col-span-2">
                  <Input
                    label="Satış Qiyməti (₼)"
                    type="number"
                    step="0.01"
                    {...register('satis_qiymeti', { valueAsNumber: true })}
                    error={errors.satis_qiymeti?.message}
                  />
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Təsvir
                </label>
                <textarea
                  {...register('tesvir')}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Stock Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Stok Miqdarları (Ölçülərə görə)
              </h4>
              <span className="text-sm text-gray-500">
                Ümumi: <strong className="text-primary-600">{getTotalStock()}</strong> ədəd
              </span>
            </div>
            
            {loadingStock ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {stockEntries.map((entry) => (
                  <div key={entry.olcu_id} className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1 text-center">
                      {entry.olcu}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={entry.miqdar}
                      onChange={(e) =>
                        handleStockChange(entry.olcu_id, parseInt(e.target.value) || 0)
                      }
                      className={`w-full px-2 py-2 text-center border rounded-lg text-sm font-medium transition-all
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                        ${entry.miqdar > 0 
                          ? 'border-green-300 bg-green-50 text-green-700' 
                          : 'border-gray-300 bg-white text-gray-700'
                        }`}
                    />
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3">
              * Hər ölçü üçün stok miqdarını daxil edin. Boş buraxsanız 0 olaraq qeyd ediləcək.
            </p>
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t">
            <div>
              {editingProduct && (
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => {
                    setIsModalOpen(false);
                    setBarcodePrintProduct(editingProduct);
                  }}
                >
                  Barkod Çap Et
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Ləğv et
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {editingProduct ? 'Yenilə' : 'Əlavə et'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Məhsulu Sil"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          <strong>{deleteConfirm?.ad}</strong> məhsulunu silmək istədiyinizə
          əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Ləğv et
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Sil
          </Button>
        </div>
      </Modal>

      {/* Barcode Print Modal */}
      <BarcodePrintModal
        isOpen={!!barcodePrintProduct}
        onClose={() => setBarcodePrintProduct(null)}
        product={barcodePrintProduct}
      />
    </div>
  );
};
