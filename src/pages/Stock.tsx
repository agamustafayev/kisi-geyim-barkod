import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Select, Modal, Table } from '@/components/ui';
import { stockApi } from '@/lib/tauri';
import { useProducts } from '@/hooks';
import { useAppStore } from '@/store/appStore';
import { sortSizes } from '@/lib/utils';
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  Search,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { Stock, CreateStock } from '@/types';

export const StockPage: React.FC = () => {
  const { products, sizes, loadData: loadProducts } = useProducts();
  const { addToast, loading, setLoading, isAdmin } = useAppStore();

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Stock | null>(null);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [selectedSize, setSelectedSize] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(0);
  const [minQuantity, setMinQuantity] = useState(1);

  const loadStocks = async () => {
    setLoading(true);
    try {
      const data = await stockApi.stokSiyahisi();
      setStocks(data);
      setFilteredStocks(data);
    } catch (error) {
      addToast('error', 'Stok məlumatları yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
    loadProducts();
  }, []);

  // Filter stocks
  useEffect(() => {
    let filtered = [...stocks];

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.mehsul_adi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.mehsul_barkod?.includes(searchQuery)
      );
    }

    if (showLowStock) {
      filtered = filtered.filter((s) => s.miqdar <= s.minimum_miqdar);
    }

    setFilteredStocks(filtered);
  }, [stocks, searchQuery, showLowStock]);

  const handleAddStock = async () => {
    if (!selectedProduct || !selectedSize) {
      addToast('warning', 'Məhsul və ölçü seçin');
      return;
    }

    const stockData: CreateStock = {
      mehsul_id: selectedProduct as number,
      olcu_id: selectedSize as number,
      miqdar: quantity,
      minimum_miqdar: minQuantity,
    };

    try {
      await stockApi.stokElaveEt(stockData);
      addToast('success', 'Stok uğurla əlavə edildi');
      setIsAddModalOpen(false);
      resetForm();
      loadStocks();
    } catch (error) {
      addToast('error', 'Stok əlavə edilə bilmədi');
    }
  };

  const handleUpdateStock = async () => {
    if (!editingStock) return;

    try {
      await stockApi.stokYenile(
        editingStock.mehsul_id,
        editingStock.olcu_id,
        { miqdar: quantity, minimum_miqdar: minQuantity }
      );
      addToast('success', 'Stok uğurla yeniləndi');
      setIsEditModalOpen(false);
      setEditingStock(null);
      loadStocks();
    } catch (error) {
      addToast('error', 'Stok yenilənə bilmədi');
    }
  };

  const openEditModal = (stock: Stock) => {
    setEditingStock(stock);
    setQuantity(stock.miqdar);
    setMinQuantity(stock.minimum_miqdar);
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setSelectedProduct('');
    setSelectedSize('');
    setQuantity(0);
    setMinQuantity(5);
  };

  const columns = [
    {
      key: 'mehsul_adi',
      header: 'Məhsul',
      render: (stock: Stock) => (
        <div>
          <p className="font-medium text-gray-900">{stock.mehsul_adi}</p>
          <p className="text-sm text-gray-500 font-mono">{stock.mehsul_barkod}</p>
        </div>
      ),
    },
    {
      key: 'olcu',
      header: 'Ölçü',
      render: (stock: Stock) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
          {stock.olcu}
        </span>
      ),
    },
    {
      key: 'miqdar',
      header: 'Miqdar',
      render: (stock: Stock) => {
        const isLow = stock.miqdar <= stock.minimum_miqdar;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isLow
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {stock.miqdar}
            </span>
            {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        );
      },
    },
    {
      key: 'minimum_miqdar',
      header: 'Minimum',
      render: (stock: Stock) => (
        <span className="text-gray-500">{stock.minimum_miqdar}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Əməliyyatlar',
      render: (stock: Stock) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus className="w-4 h-4 text-green-600" />}
            onClick={() => {
              setEditingStock(stock);
              setQuantity(stock.miqdar + 1);
              setMinQuantity(stock.minimum_miqdar);
              handleQuickUpdate(stock, 1);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Minus className="w-4 h-4 text-red-600" />}
            onClick={() => {
              if (stock.miqdar > 0) {
                handleQuickUpdate(stock, -1);
              }
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openEditModal(stock)}
          >
            Redaktə
          </Button>
          {isAdmin() && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4 text-red-600" />}
              onClick={() => setDeleteConfirm(stock)}
            />
          )}
        </div>
      ),
    },
  ];

  const handleQuickUpdate = async (stock: Stock, change: number) => {
    try {
      await stockApi.stokYenile(stock.mehsul_id, stock.olcu_id, {
        miqdar: stock.miqdar + change,
      });
      loadStocks();
    } catch (error) {
      addToast('error', 'Stok yenilənə bilmədi');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await stockApi.stokSil(deleteConfirm.mehsul_id, deleteConfirm.olcu_id);
      addToast('success', 'Stok uğurla silindi!');
      setDeleteConfirm(null);
      loadStocks();
    } catch (error) {
      addToast('error', 'Stok silinə bilmədi');
    }
  };

  const lowStockCount = stocks.filter((s) => s.miqdar <= s.minimum_miqdar).length;

  return (
    <div className="min-h-screen">
      <Header title="Stok İdarəetmə" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ümumi Stok</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stocks.reduce((sum, s) => sum + s.miqdar, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Stok Növləri</p>
                <p className="text-2xl font-bold text-gray-900">{stocks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aşağı Stok</p>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-80">
              <Input
                placeholder="Məhsul axtar..."
                icon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={showLowStock ? 'danger' : 'secondary'}
              icon={<AlertTriangle className="w-4 h-4" />}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              Aşağı Stok ({lowStockCount})
            </Button>
            <Button
              variant="secondary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={loadStocks}
            >
              Yenilə
            </Button>
          </div>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
          >
            Stok Əlavə Et
          </Button>
        </div>

        {/* Stock Table */}
        <Table
          columns={columns}
          data={filteredStocks}
          keyExtractor={(s) => `${s.mehsul_id}-${s.olcu_id}`}
          loading={loading}
          emptyMessage="Stok tapılmadı"
        />
      </div>

      {/* Add Stock Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Stok Əlavə Et"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Məhsul"
            options={products.map((p) => ({
              value: p.id,
              label: `${p.ad} (${p.barkod})`,
            }))}
            placeholder="Məhsul seçin..."
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(Number(e.target.value))}
          />

          <Select
            label="Ölçü"
            options={sortSizes(sizes).map((s) => ({ value: s.id, label: s.olcu }))}
            placeholder="Ölçü seçin..."
            value={selectedSize}
            onChange={(e) => setSelectedSize(Number(e.target.value))}
          />

          <Input
            label="Miqdar"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />

          <Input
            label="Minimum Miqdar"
            type="number"
            value={minQuantity}
            onChange={(e) => setMinQuantity(Number(e.target.value))}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsAddModalOpen(false)}
            >
              Ləğv et
            </Button>
            <Button className="flex-1" onClick={handleAddStock}>
              Əlavə et
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Stock Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Stok Redaktə: ${editingStock?.mehsul_adi} - ${editingStock?.olcu}`}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Miqdar"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />

          <Input
            label="Minimum Miqdar"
            type="number"
            value={minQuantity}
            onChange={(e) => setMinQuantity(Number(e.target.value))}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsEditModalOpen(false)}
            >
              Ləğv et
            </Button>
            <Button className="flex-1" onClick={handleUpdateStock}>
              Yenilə
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Stoku Sil"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">
                {deleteConfirm?.mehsul_adi} - {deleteConfirm?.olcu}
              </p>
              <p className="text-sm text-gray-600">
                Bu stoku silmək istədiyinizdən əminsiniz?
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteConfirm(null)}
            >
              Ləğv et
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
