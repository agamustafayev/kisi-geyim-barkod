import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Modal, Table } from '@/components/ui';
import { returnApi, saleApi } from '@/lib/tauri';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import {
  RotateCcw,
  Search,
  Eye,
  Package,
  ShoppingBag,
  Minus,
  Plus,
  Receipt,
} from 'lucide-react';
import type { Return, ReturnWithItems, SaleWithItems, CreateReturn, CreateReturnItem } from '@/types';

export const Returns: React.FC = () => {
  const { addToast } = useAppStore();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnWithItems | null>(null);

  // New return form
  const [saleSearchQuery, setSaleSearchQuery] = useState('');
  const [searchingSale, setSearchingSale] = useState(false);
  const [foundSale, setFoundSale] = useState<SaleWithItems | null>(null);
  const [returnItems, setReturnItems] = useState<{ [key: string]: number }>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnNote, setReturnNote] = useState('');
  const [returnedItems, setReturnedItems] = useState<Set<string>>(new Set());

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await returnApi.iadeSiyahisi();
      setReturns(data);
    } catch (error) {
      console.error('Error loading returns:', error);
      addToast('error', 'Geri qaytarmalar yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const filteredReturns = returns.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.iade_nomresi.toLowerCase().includes(query) ||
      r.satis_nomresi?.toLowerCase().includes(query) ||
      r.musteri_adi?.toLowerCase().includes(query)
    );
  });

  const totalReturns = returns.length;
  const totalReturnAmount = returns.reduce((sum, r) => sum + r.toplam_mebleg, 0);
  const todayReturns = returns.filter((r) => {
    const today = new Date().toISOString().split('T')[0];
    return r.created_at.startsWith(today);
  }).length;

  const searchSale = async () => {
    if (!saleSearchQuery.trim()) return;

    setSearchingSale(true);
    try {
      // First get all sales to find the matching one
      const salesList = await saleApi.satisSiyahisi();
      const sale = salesList.find(s =>
        s.satis_nomresi.toLowerCase() === saleSearchQuery.trim().toLowerCase()
      );

      if (sale) {
        const details = await saleApi.satisDetallari(sale.id);
        setFoundSale(details);

        // Get all returns for this sale to check which items are already returned
        const allReturns = await returnApi.iadeSiyahisi();
        const saleReturns = allReturns.filter(r => r.satis_id === sale.id);

        // Collect already returned items
        const alreadyReturned = new Set<string>();
        for (const ret of saleReturns) {
          const retDetails = await returnApi.iadeDetallari(ret.id);
          retDetails.items.forEach(item => {
            alreadyReturned.add(`${item.mehsul_id}-${item.olcu_id}`);
          });
        }
        setReturnedItems(alreadyReturned);

        // Initialize return items with 0 quantities
        const items: { [key: string]: number } = {};
        details.items.forEach(item => {
          items[`${item.mehsul_id}-${item.olcu_id}`] = 0;
        });
        setReturnItems(items);
      } else {
        addToast('error', 'Satış tapılmadı');
        setFoundSale(null);
      }
    } catch (error) {
      console.error('Error searching sale:', error);
      addToast('error', 'Satış axtarışında xəta');
    } finally {
      setSearchingSale(false);
    }
  };

  const updateReturnQuantity = (itemKey: string, maxQty: number, delta: number) => {
    setReturnItems(prev => ({
      ...prev,
      [itemKey]: Math.max(0, Math.min(maxQty, (prev[itemKey] || 0) + delta)),
    }));
  };

  const getReturnTotal = () => {
    if (!foundSale) return 0;
    return foundSale.items.reduce((sum, item) => {
      const key = `${item.mehsul_id}-${item.olcu_id}`;
      const qty = returnItems[key] || 0;
      return sum + (item.vahid_qiymeti * qty);
    }, 0);
  };

  const getReturnItemsCount = () => {
    return Object.values(returnItems).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCreateReturn = async () => {
    if (!foundSale || getReturnItemsCount() === 0) {
      addToast('error', 'Ən azı 1 məhsul seçin');
      return;
    }

    try {
      const items: CreateReturnItem[] = foundSale.items
        .filter(item => {
          const key = `${item.mehsul_id}-${item.olcu_id}`;
          return (returnItems[key] || 0) > 0;
        })
        .map(item => {
          const key = `${item.mehsul_id}-${item.olcu_id}`;
          return {
            mehsul_id: item.mehsul_id,
            olcu_id: item.olcu_id,
            miqdar: returnItems[key],
            vahid_qiymeti: item.vahid_qiymeti,
          };
        });

      const returnData: CreateReturn = {
        satis_id: foundSale.id,
        items,
        sebebi: returnReason || null,
        qeyd: returnNote || null,
      };

      await returnApi.iadeYarat(returnData);
      addToast('success', 'Geri qaytarma uğurla qeydə alındı');
      setIsNewReturnModalOpen(false);
      resetReturnForm();
      loadReturns();
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  const resetReturnForm = () => {
    setSaleSearchQuery('');
    setFoundSale(null);
    setReturnItems({});
    setReturnReason('');
    setReturnNote('');
    setReturnedItems(new Set());
  };

  const viewReturnDetails = async (returnItem: Return) => {
    try {
      const details = await returnApi.iadeDetallari(returnItem.id);
      setSelectedReturn(details);
      setIsDetailModalOpen(true);
    } catch (error) {
      addToast('error', 'Geri qaytarma detalları yüklənə bilmədi');
    }
  };

  const columns = [
    {
      key: 'iade_nomresi',
      header: 'Geri Qaytarma №',
      render: (item: Return) => (
        <span className="font-mono font-semibold text-primary-600">{item.iade_nomresi}</span>
      ),
    },
    {
      key: 'satis_nomresi',
      header: 'Satış №',
      render: (item: Return) => (
        <span className="font-mono text-gray-600">{item.satis_nomresi}</span>
      ),
    },
    {
      key: 'musteri',
      header: 'Müştəri',
      render: (item: Return) => item.musteri_adi || '-',
    },
    {
      key: 'toplam_mebleg',
      header: 'Məbləğ',
      render: (item: Return) => (
        <span className="text-red-600 font-semibold">
          -{formatCurrency(item.toplam_mebleg)}
        </span>
      ),
    },
    {
      key: 'sebebi',
      header: 'Səbəb',
      render: (item: Return) => (
        <span className="text-gray-500 text-sm">{item.sebebi || '-'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Tarix',
      render: (item: Return) => formatDate(item.created_at),
    },
    {
      key: 'actions',
      header: '',
      render: (item: Return) => (
        <Button
          variant="secondary"
          size="sm"
          icon={<Eye className="w-4 h-4" />}
          onClick={() => viewReturnDetails(item)}
        >
          Detal
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Geri Qaytarma" />

      <div className="p-3 xl:p-6 space-y-4 xl:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ümumi Geri Qaytarma</p>
                <p className="text-2xl font-bold text-gray-900">{totalReturns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Geri Qaytarma Məbləği</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalReturnAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Bugünkü Geri Qaytarma</p>
                <p className="text-2xl font-bold text-gray-900">{todayReturns}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Returns List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 xl:px-6 py-4 border-b border-gray-200 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-500" />
              Geri Qaytarma Siyahısı
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <Input
                placeholder="Axtar..."
                icon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full xl:w-64"
              />
              <Button
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => {
                  resetReturnForm();
                  setIsNewReturnModalOpen(true);
                }}
              >
                Yeni Geri Qaytarma
              </Button>
            </div>
          </div>
          <Table
            columns={columns}
            data={filteredReturns}
            keyExtractor={(r) => r.id}
            loading={loading}
            emptyMessage="Geri qaytarma tapılmadı"
          />
        </div>
      </div>

      {/* New Return Modal */}
      <Modal
        isOpen={isNewReturnModalOpen}
        onClose={() => {
          setIsNewReturnModalOpen(false);
          resetReturnForm();
        }}
        title="Yeni Geri Qaytarma"
        size="lg"
      >
        <div className="space-y-4">
          {/* Sale Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Satış nömrəsi daxil edin (məs: S-XXXXXXXX)"
              icon={<Search className="w-4 h-4" />}
              value={saleSearchQuery}
              onChange={(e) => setSaleSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchSale()}
              className="flex-1"
            />
            <Button
              onClick={searchSale}
              disabled={searchingSale || !saleSearchQuery.trim()}
            >
              {searchingSale ? 'Axtarılır...' : 'Axtar'}
            </Button>
          </div>

          {/* Found Sale */}
          {foundSale && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-800">
                    Satış: {foundSale.satis_nomresi}
                  </span>
                  <span className="text-blue-600">{formatDate(foundSale.created_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">
                    Ödəniş: {foundSale.odenis_usulu}
                  </span>
                  <span className="font-medium text-blue-800">
                    {formatCurrency(foundSale.son_mebleg)}
                  </span>
                </div>
              </div>

              {/* Sale Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Məhsullar - Geri qaytarma miqdarını seçin
                </h4>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-auto">
                  {foundSale.items.map((item) => {
                    const key = `${item.mehsul_id}-${item.olcu_id}`;
                    const qty = returnItems[key] || 0;
                    const isReturned = returnedItems.has(key);
                    return (
                      <div
                        key={item.id}
                        className={`p-3 flex items-center justify-between ${isReturned ? 'bg-gray-50 opacity-60' : ''}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${isReturned ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {item.mehsul_adi}
                            </p>
                            {isReturned && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                İadə edilib
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {item.olcu} • {item.miqdar} ədəd • {formatCurrency(item.vahid_qiymeti)}/ədəd
                          </p>
                        </div>
                        {isReturned ? (
                          <div className="text-sm text-gray-500 font-medium">
                            Geri qaytarılıb
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateReturnQuantity(key, item.miqdar, -1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                              disabled={qty === 0}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className={`w-8 text-center font-semibold ${qty > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {qty}
                            </span>
                            <button
                              onClick={() => updateReturnQuantity(key, item.miqdar, 1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                              disabled={qty >= item.miqdar}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reason & Note */}
              <Input
                label="Geri Qaytarma Səbəbi"
                placeholder="Qüsurlu, yanlış ölçü, fikirlər dəyişdi..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Əlavə Qeyd
                </label>
                <textarea
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Return Summary */}
              {getReturnItemsCount() > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-red-800 font-medium">Geri Qaytarılacaq</p>
                      <p className="text-sm text-red-600">{getReturnItemsCount()} məhsul</p>
                    </div>
                    <span className="text-2xl font-bold text-red-600">
                      {formatCurrency(getReturnTotal())}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setIsNewReturnModalOpen(false);
                    resetReturnForm();
                  }}
                >
                  Ləğv et
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleCreateReturn}
                  icon={<RotateCcw className="w-4 h-4" />}
                  disabled={getReturnItemsCount() === 0}
                >
                  Geri Qaytar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Return Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Geri Qaytarma Detalları: ${selectedReturn?.iade_nomresi}`}
        size="md"
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tarix</p>
                <p className="font-medium">{formatDate(selectedReturn.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Əlaqəli Satış</p>
                <p className="font-mono font-medium">{selectedReturn.satis_nomresi}</p>
              </div>
              {selectedReturn.musteri_adi && (
                <div>
                  <p className="text-gray-500">Müştəri</p>
                  <p className="font-medium">{selectedReturn.musteri_adi}</p>
                </div>
              )}
              {selectedReturn.sebebi && (
                <div className="col-span-2">
                  <p className="text-gray-500">Səbəb</p>
                  <p className="font-medium">{selectedReturn.sebebi}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Geri Qaytarılan Məhsullar
              </h4>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {selectedReturn.items.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{item.mehsul_adi}</p>
                      <p className="text-sm text-gray-500">
                        {item.olcu} • {item.miqdar} ədəd × {formatCurrency(item.vahid_qiymeti)}
                      </p>
                    </div>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(item.toplam_qiymet)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Ümumi Geri Qaytarma:</span>
                <span className="text-red-600">-{formatCurrency(selectedReturn.toplam_mebleg)}</span>
              </div>
            </div>

            {selectedReturn.qeyd && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <strong>Qeyd:</strong> {selectedReturn.qeyd}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
