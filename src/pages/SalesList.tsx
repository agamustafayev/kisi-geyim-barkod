import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Modal, Table } from '@/components/ui';
import { ReceiptModal } from '@/components/receipt';
import { reportApi, saleApi, returnApi } from '@/lib/tauri';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import {
  Calendar,
  RefreshCw,
  Eye,
  CreditCard,
  Banknote,
  ShoppingBag,
  Filter,
  RotateCcw,
  Clock,
  Printer,
} from 'lucide-react';
import type { SaleListItem, SaleWithItems, CreateReturn, CreateReturnItem } from '@/types';

export const SalesList: React.FC = () => {
  const { addToast } = useAppStore();
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Receipt modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<SaleWithItems | null>(null);

  // Single item return modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnItem, setReturnItem] = useState<{
    mehsul_id: number;
    olcu_id: number;
    mehsul_adi: string;
    olcu: string;
    miqdar: number;
    vahid_qiymeti: number;
    maxMiqdar: number;
  } | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState('');

  // Set default dates (current month)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await reportApi.satisSiyahisiTarixeGore(
        startDate || undefined,
        endDate || undefined
      );
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadSales();
    }
  }, [startDate, endDate]);

  const viewSaleDetails = async (saleId: number) => {
    try {
      const details = await saleApi.satisDetallari(saleId);
      setSelectedSale(details);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error loading sale details:', error);
    }
  };

  const openReceiptModal = async (saleId: number) => {
    try {
      const details = await saleApi.satisDetallari(saleId);
      setReceiptSale(details);
      setIsReceiptModalOpen(true);
    } catch (error) {
      console.error('Error loading sale for receipt:', error);
    }
  };

  const openReturnModal = (item: {
    mehsul_id: number;
    olcu_id: number;
    mehsul_adi: string;
    olcu: string;
    miqdar: number;
    vahid_qiymeti: number;
    maxMiqdar: number;
  }) => {
    setReturnItem({
      ...item,
      maxMiqdar: item.maxMiqdar,
    });
    setReturnQuantity(1);
    setReturnReason('');
    setIsReturnModalOpen(true);
  };

  const handleSingleItemReturn = async () => {
    if (!selectedSale || !returnItem || returnQuantity <= 0) {
      addToast('error', 'Düzgün miqdar seçin');
      return;
    }

    try {
      const items: CreateReturnItem[] = [{
        mehsul_id: returnItem.mehsul_id,
        olcu_id: returnItem.olcu_id,
        miqdar: returnQuantity,
        vahid_qiymeti: returnItem.vahid_qiymeti,
      }];

      const returnData: CreateReturn = {
        satis_id: selectedSale.id,
        items,
        sebebi: returnReason || null,
        qeyd: null,
      };

      await returnApi.iadeYarat(returnData);
      addToast('success', `${returnItem.mehsul_adi} (${returnQuantity} ədəd) geri qaytarıldı`);
      setIsReturnModalOpen(false);
      
      // Refresh the sale details
      const updatedDetails = await saleApi.satisDetallari(selectedSale.id);
      setSelectedSale(updatedDetails);
      
      // Refresh sales list
      loadSales();
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  // Calculate totals
  const totalSales = sales.reduce((sum, s) => sum + s.son_mebleg, 0);
  const totalDiscount = sales.reduce((sum, s) => sum + s.endirim, 0);
  const totalItems = sales.reduce((sum, s) => sum + s.mehsul_sayi, 0);

  const columns = [
    {
      key: 'satis_nomresi',
      header: 'Satış №',
      sortable: true,
      render: (sale: SaleListItem) => (
        <span className="font-mono font-medium text-primary-600">
          {sale.satis_nomresi}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Tarix',
      sortable: true,
      render: (sale: SaleListItem) => formatDate(sale.created_at),
    },
    {
      key: 'mehsul_sayi',
      header: 'Məhsul Sayı',
      sortable: true,
      render: (sale: SaleListItem) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
          {sale.mehsul_sayi} ədəd
        </span>
      ),
    },
    {
      key: 'toplam_mebleg',
      header: 'Cəmi',
      sortable: true,
      render: (sale: SaleListItem) => formatCurrency(sale.toplam_mebleg),
    },
    {
      key: 'endirim',
      header: 'Endirim',
      sortable: true,
      render: (sale: SaleListItem) =>
        sale.endirim > 0 ? (
          <span className="text-orange-600">-{formatCurrency(sale.endirim)}</span>
        ) : (
          '-'
        ),
    },
    {
      key: 'son_mebleg',
      header: 'Yekun',
      sortable: true,
      render: (sale: SaleListItem) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(sale.son_mebleg)}
        </span>
      ),
    },
    {
      key: 'odenis_usulu',
      header: 'Ödəniş',
      sortable: true,
      render: (sale: SaleListItem) => (
        <span className="flex items-center gap-1">
          {sale.odenis_usulu === 'Kart' ? (
            <CreditCard className="w-4 h-4 text-blue-500" />
          ) : sale.odenis_usulu === 'Nisyə' ? (
            <Clock className="w-4 h-4 text-orange-500" />
          ) : (
            <Banknote className="w-4 h-4 text-green-500" />
          )}
          {sale.odenis_usulu}
        </span>
      ),
    },
    {
      key: 'iade_durumu',
      header: 'İadə Statusu',
      sortable: true,
      render: (sale: SaleListItem) => {
        const status = sale.iade_durumu || 'Yoxdur';
        const statusConfig = {
          'Yoxdur': { bg: 'bg-green-100', text: 'text-green-700', label: 'Yoxdur' },
          'Qismən': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Qismən' },
          'Tam': { bg: 'bg-red-100', text: 'text-red-700', label: 'Tam İadə' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Yoxdur'];
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Əməliyyat',
      render: (sale: SaleListItem) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => viewSaleDetails(sale.id)}
          >
            Bax
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => openReceiptModal(sale.id)}
            title="Çek Çap Et"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Satış Siyahısı" />

      <div className="p-3 xl:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-6 mb-4 xl:mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-3 xl:p-5">
            <div className="flex items-center gap-2 xl:gap-3">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4 xl:w-5 xl:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs xl:text-sm text-gray-500 truncate">Satış Sayı</p>
                <p className="text-lg xl:text-xl font-bold text-gray-900">{sales.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3 xl:p-5">
            <div className="flex items-center gap-2 xl:gap-3">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Banknote className="w-4 h-4 xl:w-5 xl:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs xl:text-sm text-gray-500 truncate">Ümumi Satış</p>
                <p className="text-lg xl:text-xl font-bold text-green-600 truncate">{formatCurrency(totalSales)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3 xl:p-5">
            <div className="flex items-center gap-2 xl:gap-3">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Filter className="w-4 h-4 xl:w-5 xl:h-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs xl:text-sm text-gray-500 truncate">Endirim</p>
                <p className="text-lg xl:text-xl font-bold text-orange-600 truncate">{formatCurrency(totalDiscount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3 xl:p-5">
            <div className="flex items-center gap-2 xl:gap-3">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4 xl:w-5 xl:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs xl:text-sm text-gray-500 truncate">Satılan Məhsul</p>
                <p className="text-lg xl:text-xl font-bold text-purple-600">{totalItems} ədəd</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Compact */}
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 mb-4 flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => {
                const now = new Date();
                setStartDate(now.toISOString().split('T')[0]);
                setEndDate(now.toISOString().split('T')[0]);
              }}
              className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded"
            >
              Bu gün
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                setStartDate(firstDay.toISOString().split('T')[0]);
                setEndDate(now.toISOString().split('T')[0]);
              }}
              className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded"
            >
              Bu ay
            </button>
            <button
              onClick={loadSales}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sales Table */}
        <Table
          columns={columns}
          data={sales}
          keyExtractor={(s) => s.id}
          loading={loading}
          emptyMessage="Seçilmiş tarix aralığında satış tapılmadı"
        />
      </div>

      {/* Sale Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Satış Detalları - ${selectedSale?.satis_nomresi}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-6">
            {/* Sale Info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Tarix</p>
                <p className="font-medium">{formatDate(selectedSale.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ödəniş Üsulu</p>
                <p className="font-medium flex items-center gap-1">
                  {selectedSale.odenis_usulu === 'Kart' ? (
                    <CreditCard className="w-4 h-4" />
                  ) : selectedSale.odenis_usulu === 'Nisyə' ? (
                    <Clock className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Banknote className="w-4 h-4" />
                  )}
                  {selectedSale.odenis_usulu}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Qeyd</p>
                <p className="font-medium">{selectedSale.qeyd || '-'}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                <span>Məhsullar</span>
                <span className="text-sm font-normal text-gray-500">
                  Geri qaytarma üçün düyməyə basın
                </span>
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                        Məhsul
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                        Ölçü
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                        Qiymət
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                        Miqdar
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                        Cəmi
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">
                        Əməliyyat
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSale.items.map((item, idx) => {
                      const hasReturn = item.iade_miqdar && item.iade_miqdar > 0;
                      return (
                        <tr key={idx} className={`hover:bg-gray-50 ${hasReturn ? 'bg-red-50' : ''}`}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.mehsul_adi}</p>
                              <p className="text-xs text-gray-500 font-mono">{item.mehsul_barkod}</p>
                              {hasReturn && (
                                <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                                  <RotateCcw className="w-3 h-3" />
                                  İadə edildi: {item.iade_miqdar} ədəd
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.olcu}</td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {formatCurrency(item.vahid_qiymeti)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {item.miqdar}
                            {hasReturn && (
                              <span className="text-xs text-red-600 block">
                                (Net: {item.miqdar - item.iade_miqdar})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(item.toplam_qiymet)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<RotateCcw className="w-3 h-3" />}
                              onClick={() => openReturnModal({
                                mehsul_id: item.mehsul_id,
                                olcu_id: item.olcu_id,
                                mehsul_adi: item.mehsul_adi || '',
                                olcu: item.olcu || '',
                                miqdar: item.miqdar,
                                vahid_qiymeti: item.vahid_qiymeti,
                                maxMiqdar: item.miqdar - (item.iade_miqdar || 0),
                              })}
                              disabled={hasReturn ? (item.miqdar - item.iade_miqdar <= 0) : false}
                            >
                              {hasReturn && item.miqdar - item.iade_miqdar <= 0 ? 'İadə edildi' : 'Geri Qaytar'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Cəmi:</span>
                <span>{formatCurrency(selectedSale.toplam_mebleg)}</span>
              </div>
              {selectedSale.endirim > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Endirim:</span>
                  <span>-{formatCurrency(selectedSale.endirim)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Yekun Məbləğ:</span>
                <span className="text-green-600">{formatCurrency(selectedSale.son_mebleg)}</span>
              </div>
            </div>

            {/* Print Button */}
            <div className="pt-4 border-t">
              <Button
                variant="primary"
                className="w-full"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => {
                  setReceiptSale(selectedSale);
                  setIsReceiptModalOpen(true);
                }}
              >
                Çek Çap Et
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Single Item Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Məhsulu Geri Qaytar"
        size="sm"
      >
        {returnItem && (
          <div className="space-y-4">
            {/* Item Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900">{returnItem.mehsul_adi}</p>
              <p className="text-sm text-gray-500">
                Ölçü: {returnItem.olcu} • Qiymət: {formatCurrency(returnItem.vahid_qiymeti)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Maksimum geri qaytarıla bilən: <span className="font-medium">{returnItem.maxMiqdar} ədəd</span>
              </p>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geri Qaytarılacaq Miqdar
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReturnQuantity(Math.max(1, returnQuantity - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  disabled={returnQuantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={returnQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setReturnQuantity(Math.max(1, Math.min(returnItem.maxMiqdar, val)));
                  }}
                  className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg"
                  min={1}
                  max={returnItem.maxMiqdar}
                />
                <button
                  onClick={() => setReturnQuantity(Math.min(returnItem.maxMiqdar, returnQuantity + 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  disabled={returnQuantity >= returnItem.maxMiqdar}
                >
                  +
                </button>
                <button
                  onClick={() => setReturnQuantity(returnItem.maxMiqdar)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Hamısı
                </button>
              </div>
            </div>

            {/* Reason */}
            <Input
              label="Geri Qaytarma Səbəbi (istəyə bağlı)"
              placeholder="Qüsurlu, yanlış ölçü..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />

            {/* Summary */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-red-800 font-medium">Geri Qaytarılacaq</p>
                  <p className="text-sm text-red-600">{returnQuantity} ədəd</p>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  -{formatCurrency(returnItem.vahid_qiymeti * returnQuantity)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsReturnModalOpen(false)}
              >
                Ləğv et
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleSingleItemReturn}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Geri Qaytar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={receiptSale}
      />
    </div>
  );
};
