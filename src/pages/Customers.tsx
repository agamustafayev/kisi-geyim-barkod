import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Modal, Table } from '@/components/ui';
import { customerApi, saleApi, paymentApi } from '@/lib/tauri';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Edit,
  Trash2,
  Eye,
  Clock,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  Banknote,
  Wallet,
  DollarSign,
} from 'lucide-react';
import type { Customer, CreateCustomer, CustomerSaleItem, SaleWithItems, DebtPayment, CreateDebtPayment } from '@/types';

interface CustomerWithDebt extends Customer {
  toplam_borc: number;
}

export const Customers: React.FC = () => {
  const { addToast } = useAppStore();
  const [customers, setCustomers] = useState<CustomerWithDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'debt'>('debt');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDebt | null>(null);
  const [customerSales, setCustomerSales] = useState<CustomerSaleItem[]>([]);
  const [customerSalesLoading, setCustomerSalesLoading] = useState(false);
  const [customerPayments, setCustomerPayments] = useState<DebtPayment[]>([]);
  const [customerPaymentsLoading, setCustomerPaymentsLoading] = useState(false);
  
  // Sale detail modal
  const [isSaleDetailModalOpen, setIsSaleDetailModalOpen] = useState(false);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<SaleWithItems | null>(null);
  const [saleDetailLoading, setSaleDetailLoading] = useState(false);
  
  // Payment form
  const [paymentForm, setPaymentForm] = useState<CreateDebtPayment>({
    musteri_id: 0,
    mebleg: 0,
    odenis_usulu: 'Nağd',
    qeyd: '',
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateCustomer>({
    ad: '',
    soyad: '',
    telefon: '',
    qeyd: '',
    baslangic_borcu: null,
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerApi.musteriSiyahisi();
      
      // Get debt for each customer
      const customersWithDebt: CustomerWithDebt[] = await Promise.all(
        data.map(async (customer) => {
          const borc = await customerApi.musteriNisyeBorclari(customer.id);
          return { ...customer, toplam_borc: borc };
        })
      );
      
      setCustomers(customersWithDebt);
    } catch (error) {
      console.error('Error loading customers:', error);
      addToast('error', 'Müştərilər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter and sort customers
  const filteredCustomers = customers
    .filter((c) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        c.ad.toLowerCase().includes(query) ||
        c.soyad.toLowerCase().includes(query) ||
        c.telefon.includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'debt') {
        return b.toplam_borc - a.toplam_borc;
      }
      return `${a.ad} ${a.soyad}`.localeCompare(`${b.ad} ${b.soyad}`);
    });

  const totalDebt = customers.reduce((sum, c) => sum + c.toplam_borc, 0);
  const customersWithDebt = customers.filter((c) => c.toplam_borc > 0).length;

  const handleAddCustomer = async () => {
    if (!formData.ad || !formData.soyad || !formData.telefon) {
      addToast('error', 'Ad, soyad və telefon tələb olunur');
      return;
    }

    try {
      await customerApi.musteriElaveEt(formData);
      addToast('success', 'Müştəri əlavə edildi');
      setIsAddModalOpen(false);
      setFormData({ ad: '', soyad: '', telefon: '', qeyd: '', baslangic_borcu: null });
      loadCustomers();
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      await customerApi.musteriYenile(selectedCustomer.id, {
        ad: formData.ad,
        soyad: formData.soyad,
        telefon: formData.telefon,
        qeyd: formData.qeyd,
      });
      addToast('success', 'Müştəri yeniləndi');
      setIsEditModalOpen(false);
      loadCustomers();
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      await customerApi.musteriSil(selectedCustomer.id);
      addToast('success', 'Müştəri silindi');
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  const openEditModal = (customer: CustomerWithDebt) => {
    setSelectedCustomer(customer);
    setFormData({
      ad: customer.ad,
      soyad: customer.soyad,
      telefon: customer.telefon,
      qeyd: customer.qeyd || '',
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = async (customer: CustomerWithDebt) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
    setCustomerSalesLoading(true);
    setCustomerPaymentsLoading(true);
    
    try {
      const [sales, payments] = await Promise.all([
        customerApi.musteriSatisKecmisi(customer.id),
        paymentApi.musteriOdemeKecmisi(customer.id),
      ]);
      setCustomerSales(sales);
      setCustomerPayments(payments);
    } catch (error) {
      console.error('Error loading customer details:', error);
    } finally {
      setCustomerSalesLoading(false);
      setCustomerPaymentsLoading(false);
    }
  };

  const openPaymentModal = (customer: CustomerWithDebt) => {
    setSelectedCustomer(customer);
    setPaymentForm({
      musteri_id: customer.id,
      mebleg: 0,
      odenis_usulu: 'Nağd',
      qeyd: '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleMakePayment = async () => {
    if (!selectedCustomer || paymentForm.mebleg <= 0) {
      addToast('error', 'Ödəniş məbləği düzgün deyil');
      return;
    }

    if (paymentForm.mebleg > selectedCustomer.toplam_borc) {
      addToast('error', 'Ödəniş məbləği borcdan çox ola bilməz');
      return;
    }

    setPaymentSubmitting(true);
    try {
      await paymentApi.borcOdemeYarat(paymentForm);
      addToast('success', 'Ödəniş uğurla qeyd edildi');
      setIsPaymentModalOpen(false);
      loadCustomers();
      
      // If detail modal is open, refresh it
      if (isDetailModalOpen && selectedCustomer) {
        openDetailModal(selectedCustomer);
      }
    } catch (error: any) {
      addToast('error', error.toString());
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const openSaleDetailModal = async (saleId: number) => {
    setSaleDetailLoading(true);
    setIsSaleDetailModalOpen(true);
    
    try {
      const details = await saleApi.satisDetallari(saleId);
      setSelectedSaleDetails(details);
    } catch (error) {
      console.error('Error loading sale details:', error);
      addToast('error', 'Satış detalları yüklənə bilmədi');
    } finally {
      setSaleDetailLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Müştəri',
      render: (customer: CustomerWithDebt) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
            {customer.ad[0]}{customer.soyad[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {customer.ad} {customer.soyad}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {customer.telefon}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'debt',
      header: 'Borc',
      render: (customer: CustomerWithDebt) => (
        <div>
          {customer.toplam_borc > 0 ? (
            <span className="text-lg font-bold text-red-600">
              {formatCurrency(customer.toplam_borc)}
            </span>
          ) : (
            <span className="text-green-600 font-medium">Borcsuz</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Qeydiyyat Tarixi',
      render: (customer: CustomerWithDebt) => (
        <span className="text-gray-600">{formatDate(customer.created_at)}</span>
      ),
    },
    {
      key: 'qeyd',
      header: 'Qeyd',
      render: (customer: CustomerWithDebt) => (
        <span className="text-gray-500 text-sm truncate max-w-[200px] block">
          {customer.qeyd || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Əməliyyatlar',
      render: (customer: CustomerWithDebt) => (
        <div className="flex items-center gap-2">
          {customer.toplam_borc > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Wallet className="w-4 h-4 text-green-600" />}
              onClick={() => openPaymentModal(customer)}
              title="Borc Ödə"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => openDetailModal(customer)}
            title="Detallara Bax"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => openEditModal(customer)}
            title="Redaktə Et"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            onClick={() => {
              setSelectedCustomer(customer);
              setIsDeleteModalOpen(true);
            }}
            title="Sil"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Müştərilər" />

      <div className="p-3 xl:p-6 space-y-4 xl:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ümumi Müştəri</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ümumi Borc</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Borclu Müştəri</p>
                <p className="text-2xl font-bold text-orange-600">{customersWithDebt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Müştəri axtar..."
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSortBy('debt')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  sortBy === 'debt'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Borca Görə
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  sortBy === 'name'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ada Görə
              </button>
            </div>
          </div>
          <Button
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              setFormData({ ad: '', soyad: '', telefon: '', qeyd: '', baslangic_borcu: null });
              setIsAddModalOpen(true);
            }}
          >
            Yeni Müştəri
          </Button>
        </div>

        {/* Customers Table */}
        <Table
          columns={columns}
          data={filteredCustomers}
          keyExtractor={(c) => c.id}
          loading={loading}
          emptyMessage="Müştəri tapılmadı"
        />
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Yeni Müştəri Əlavə Et"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ad *"
              value={formData.ad}
              onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
              placeholder="Ad"
            />
            <Input
              label="Soyad *"
              value={formData.soyad}
              onChange={(e) => setFormData({ ...formData, soyad: e.target.value })}
              placeholder="Soyad"
            />
          </div>
          <Input
            label="Telefon Nömrəsi *"
            value={formData.telefon}
            onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
            placeholder="+994 XX XXX XX XX"
            icon={<Phone className="w-4 h-4" />}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Qeyd
            </label>
            <textarea
              value={formData.qeyd || ''}
              onChange={(e) => setFormData({ ...formData, qeyd: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Əlavə qeydlər..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Başlanğıc Borcu (AZN)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.baslangic_borcu ?? ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                baslangic_borcu: e.target.value ? parseFloat(e.target.value) : null 
              })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Əgər müştərinin əvvəlki borcu varsa, buradan sistemə əlavə edə bilərsiniz
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsAddModalOpen(false)}
            >
              Ləğv et
            </Button>
            <Button className="flex-1" onClick={handleAddCustomer}>
              Əlavə Et
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Müştərini Redaktə Et"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ad *"
              value={formData.ad}
              onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
            />
            <Input
              label="Soyad *"
              value={formData.soyad}
              onChange={(e) => setFormData({ ...formData, soyad: e.target.value })}
            />
          </div>
          <Input
            label="Telefon Nömrəsi *"
            value={formData.telefon}
            onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
            icon={<Phone className="w-4 h-4" />}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Qeyd
            </label>
            <textarea
              value={formData.qeyd || ''}
              onChange={(e) => setFormData({ ...formData, qeyd: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsEditModalOpen(false)}
            >
              Ləğv et
            </Button>
            <Button className="flex-1" onClick={handleEditCustomer}>
              Yadda Saxla
            </Button>
          </div>
        </div>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Müştəri Detalları"
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {selectedCustomer.ad[0]}{selectedCustomer.soyad[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedCustomer.ad} {selectedCustomer.soyad}
                </h3>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4" />
                  {selectedCustomer.telefon}
                </p>
                {selectedCustomer.qeyd && (
                  <p className="text-gray-600 text-sm mt-2">{selectedCustomer.qeyd}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Ümumi Borc</p>
                <p className={`text-2xl font-bold ${
                  selectedCustomer.toplam_borc > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {selectedCustomer.toplam_borc > 0 
                    ? formatCurrency(selectedCustomer.toplam_borc)
                    : 'Borcsuz'}
                </p>
                {selectedCustomer.toplam_borc > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Wallet className="w-4 h-4" />}
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      openPaymentModal(selectedCustomer);
                    }}
                    className="mt-2"
                  >
                    Borc Ödə
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nisyə Satışlar</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedCustomer.toplam_borc > 0 ? '1+' : '0'}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Qeydiyyat</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(selectedCustomer.created_at)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <ShoppingBag className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Son Yenilənmə</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(selectedCustomer.updated_at)}
                </p>
              </div>
            </div>

            {/* Debt Warning */}
            {selectedCustomer.toplam_borc > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="font-semibold text-red-800">Borc Xəbərdarlığı</p>
                  <p className="text-sm text-red-600">
                    Bu müştərinin {formatCurrency(selectedCustomer.toplam_borc)} məbləğində ödənilməmiş nisyə borcu var.
                  </p>
                </div>
              </div>
            )}

            {/* Sales History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Satış Keçmişi ({customerSales.length})
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {customerSalesLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </div>
                ) : customerSales.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Bu müştərinin satış keçmişi yoxdur</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-64 overflow-auto">
                    {customerSales.map((sale) => (
                      <button
                        key={sale.id}
                        onClick={() => openSaleDetailModal(sale.id)}
                        className="w-full p-3 hover:bg-gray-50 flex items-center justify-between text-left transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{sale.satis_nomresi}</p>
                          <p className="text-sm text-gray-500">{formatDate(sale.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`font-semibold ${
                              sale.odenis_usulu === 'Nisyə' ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {formatCurrency(sale.son_mebleg)}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                              {sale.odenis_usulu === 'Nisyə' ? (
                                <Clock className="w-3 h-3" />
                              ) : sale.odenis_usulu === 'Kart' ? (
                                <CreditCard className="w-3 h-3" />
                              ) : (
                                <Banknote className="w-3 h-3" />
                              )}
                              {sale.odenis_usulu}
                            </p>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Ödəniş Keçmişi ({customerPayments.length})
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {customerPaymentsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </div>
                ) : customerPayments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Bu müştərinin ödəniş keçmişi yoxdur</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-64 overflow-auto">
                    {customerPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Ödəniş</p>
                            <p className="text-sm text-gray-500">{formatDate(payment.created_at)}</p>
                            {payment.qeyd && (
                              <p className="text-xs text-gray-400 italic">{payment.qeyd}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +{formatCurrency(payment.mebleg)}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                            {payment.odenis_usulu === 'Kart' ? (
                              <CreditCard className="w-3 h-3" />
                            ) : (
                              <Banknote className="w-3 h-3" />
                            )}
                            {payment.odenis_usulu}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Müştərini Sil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            <strong>{selectedCustomer?.ad} {selectedCustomer?.soyad}</strong> adlı müştərini 
            silmək istədiyinizə əminsiniz?
          </p>
          {selectedCustomer && selectedCustomer.toplam_borc > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">
                ⚠️ Bu müştərinin {formatCurrency(selectedCustomer.toplam_borc)} borcu var!
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Ləğv et
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeleteCustomer}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Borc Ödənişi"
        size="md"
      >
        <div className="space-y-4">
          {selectedCustomer && (
            <>
              {/* Customer Info */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-gray-600">Müştəri</p>
                    <p className="font-semibold text-gray-900">
                      {selectedCustomer.ad} {selectedCustomer.soyad}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Cari Borc</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(selectedCustomer.toplam_borc)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ödəniş Məbləği (AZN) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedCustomer.toplam_borc}
                  value={paymentForm.mebleg || ''}
                  onChange={(e) => setPaymentForm({ 
                    ...paymentForm, 
                    mebleg: parseFloat(e.target.value) || 0 
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                  placeholder="0.00"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setPaymentForm({ 
                      ...paymentForm, 
                      mebleg: selectedCustomer.toplam_borc / 2 
                    })}
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Yarısı
                  </button>
                  <button
                    onClick={() => setPaymentForm({ 
                      ...paymentForm, 
                      mebleg: selectedCustomer.toplam_borc 
                    })}
                    className="flex-1 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors font-medium"
                  >
                    Tam Ödə
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ödəniş Üsulu *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentForm({ ...paymentForm, odenis_usulu: 'Nağd' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentForm.odenis_usulu === 'Nağd'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Banknote className={`w-6 h-6 mx-auto mb-1 ${
                      paymentForm.odenis_usulu === 'Nağd' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      paymentForm.odenis_usulu === 'Nağd' ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      Nağd
                    </p>
                  </button>
                  <button
                    onClick={() => setPaymentForm({ ...paymentForm, odenis_usulu: 'Kart' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentForm.odenis_usulu === 'Kart'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`w-6 h-6 mx-auto mb-1 ${
                      paymentForm.odenis_usulu === 'Kart' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      paymentForm.odenis_usulu === 'Kart' ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      Kart
                    </p>
                  </button>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Qeyd
                </label>
                <textarea
                  value={paymentForm.qeyd || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, qeyd: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ödəniş haqqında qeyd..."
                />
              </div>

              {/* Summary */}
              {paymentForm.mebleg > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Ödəniləcək:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(paymentForm.mebleg)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-green-200">
                    <span className="text-gray-700">Qalan Borc:</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(selectedCustomer.toplam_borc - paymentForm.mebleg)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={paymentSubmitting}
                >
                  Ləğv et
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleMakePayment}
                  disabled={paymentSubmitting || paymentForm.mebleg <= 0}
                  icon={paymentSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                >
                  {paymentSubmitting ? 'Yadda saxlanılır...' : 'Ödənişi Qeyd Et'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Sale Detail Modal */}
      <Modal
        isOpen={isSaleDetailModalOpen}
        onClose={() => {
          setIsSaleDetailModalOpen(false);
          setSelectedSaleDetails(null);
        }}
        title={`Satış Detalları - ${selectedSaleDetails?.satis_nomresi || ''}`}
        size="lg"
      >
        {saleDetailLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-500 mt-3">Yüklənir...</p>
          </div>
        ) : selectedSaleDetails ? (
          <div className="space-y-6">
            {/* Sale Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Tarix</p>
                <p className="font-medium">{formatDate(selectedSaleDetails.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ödəniş Üsulu</p>
                <p className="font-medium flex items-center gap-1">
                  {selectedSaleDetails.odenis_usulu === 'Kart' ? (
                    <CreditCard className="w-4 h-4" />
                  ) : selectedSaleDetails.odenis_usulu === 'Nisyə' ? (
                    <Clock className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Banknote className="w-4 h-4" />
                  )}
                  {selectedSaleDetails.odenis_usulu}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cəmi</p>
                <p className="font-medium">{formatCurrency(selectedSaleDetails.toplam_mebleg)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Endirim</p>
                <p className="font-medium text-orange-600">
                  {selectedSaleDetails.endirim > 0 ? `-${formatCurrency(selectedSaleDetails.endirim)}` : '-'}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Məhsullar ({selectedSaleDetails.items.length})
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSaleDetails.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.mehsul_adi}</p>
                            <p className="text-xs text-gray-500 font-mono">{item.mehsul_barkod}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm">{item.olcu}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(item.vahid_qiymeti)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{item.miqdar}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(item.toplam_qiymet)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Cəmi:</span>
                <span>{formatCurrency(selectedSaleDetails.toplam_mebleg)}</span>
              </div>
              {selectedSaleDetails.endirim > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Endirim:</span>
                  <span>-{formatCurrency(selectedSaleDetails.endirim)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Yekun Məbləğ:</span>
                <span className={selectedSaleDetails.odenis_usulu === 'Nisyə' ? 'text-orange-600' : 'text-green-600'}>
                  {formatCurrency(selectedSaleDetails.son_mebleg)}
                </span>
              </div>
              {selectedSaleDetails.odenis_usulu === 'Nisyə' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-orange-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Bu satış nisyə (veresiye) olaraq qeyd edilmişdir
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
