import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Modal, Table } from '@/components/ui';
import { paymentApi } from '@/lib/tauri';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import {
  Wallet,
  Search,
  CreditCard,
  Banknote,
  Phone,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
} from 'lucide-react';
import type { CustomerDebtSummary, DebtPayment, CreateDebtPayment } from '@/types';

export const DebtPayments: React.FC = () => {
  const { addToast } = useAppStore();
  const [debtSummaries, setDebtSummaries] = useState<CustomerDebtSummary[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebtSummary | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Nağd');
  const [paymentNote, setPaymentNote] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaries, paymentList] = await Promise.all([
        paymentApi.musteriBorcXulasesi(),
        paymentApi.borcOdemeSiyahisi(),
      ]);
      setDebtSummaries(summaries);
      setPayments(paymentList);
    } catch (error) {
      console.error('Error loading data:', error);
      addToast('error', 'Məlumatlar yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSummaries = debtSummaries.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.musteri_adi.toLowerCase().includes(query) ||
      s.telefon.includes(query)
    );
  });

  const totalDebt = debtSummaries.reduce((sum, s) => sum + s.qalan_borc, 0);
  const totalPaid = debtSummaries.reduce((sum, s) => sum + s.toplam_odenis, 0);
  const customersWithDebt = debtSummaries.filter((s) => s.qalan_borc > 0).length;

  const openPaymentModal = (customer: CustomerDebtSummary) => {
    setSelectedCustomer(customer);
    setPaymentAmount(customer.qalan_borc);
    setPaymentMethod('Nağd');
    setPaymentNote('');
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedCustomer || paymentAmount <= 0) {
      addToast('error', 'Düzgün məbləğ daxil edin');
      return;
    }

    try {
      const payment: CreateDebtPayment = {
        musteri_id: selectedCustomer.musteri_id,
        mebleg: paymentAmount,
        odenis_usulu: paymentMethod,
        qeyd: paymentNote || null,
      };

      await paymentApi.borcOdemeYarat(payment);
      addToast('success', 'Ödəmə uğurla qeydə alındı');
      setIsPaymentModalOpen(false);
      loadData();
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  const summaryColumns = [
    {
      key: 'customer',
      header: 'Müştəri',
      render: (item: CustomerDebtSummary) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
            {item.musteri_adi.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.musteri_adi}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {item.telefon}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'toplam_borc',
      header: 'Ümumi Borc',
      render: (item: CustomerDebtSummary) => (
        <span className="text-gray-600">{formatCurrency(item.toplam_borc)}</span>
      ),
    },
    {
      key: 'toplam_odenis',
      header: 'Ödənilmiş',
      render: (item: CustomerDebtSummary) => (
        <span className="text-green-600">{formatCurrency(item.toplam_odenis)}</span>
      ),
    },
    {
      key: 'qalan_borc',
      header: 'Qalan Borc',
      render: (item: CustomerDebtSummary) => (
        <span className={`text-lg font-bold ${item.qalan_borc > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {item.qalan_borc > 0 ? formatCurrency(item.qalan_borc) : 'Ödənilib ✓'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Əməliyyat',
      render: (item: CustomerDebtSummary) => (
        <Button
          size="sm"
          icon={<Wallet className="w-4 h-4" />}
          onClick={() => openPaymentModal(item)}
          disabled={item.qalan_borc <= 0}
        >
          Ödə
        </Button>
      ),
    },
  ];

  const paymentColumns = [
    {
      key: 'customer',
      header: 'Müştəri',
      render: (item: DebtPayment) => (
        <span className="font-medium text-gray-900">{item.musteri_adi}</span>
      ),
    },
    {
      key: 'mebleg',
      header: 'Məbləğ',
      render: (item: DebtPayment) => (
        <span className="text-lg font-bold text-green-600">
          +{formatCurrency(item.mebleg)}
        </span>
      ),
    },
    {
      key: 'odenis_usulu',
      header: 'Ödəniş Üsulu',
      render: (item: DebtPayment) => (
        <span className="flex items-center gap-1">
          {item.odenis_usulu === 'Kart' ? (
            <CreditCard className="w-4 h-4 text-blue-500" />
          ) : item.odenis_usulu === 'Geri Qaytarma' ? (
            <TrendingDown className="w-4 h-4 text-orange-500" />
          ) : (
            <Banknote className="w-4 h-4 text-green-500" />
          )}
          {item.odenis_usulu}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Tarix',
      render: (item: DebtPayment) => formatDate(item.created_at),
    },
    {
      key: 'qeyd',
      header: 'Qeyd',
      render: (item: DebtPayment) => (
        <span className="text-gray-500 text-sm">{item.qeyd || '-'}</span>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Nisyə Ödəmə" />

      <div className="p-3 xl:p-6 space-y-4 xl:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 xl:gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ümumi Qalan Borc</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ümumi Ödənilmiş</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
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

          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ödəmə Sayı</p>
                <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Debt Summaries */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Borclu Müştərilər
            </h3>
            <Input
              placeholder="Müştəri axtar..."
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
          <Table
            columns={summaryColumns}
            data={filteredSummaries}
            keyExtractor={(s) => s.musteri_id}
            loading={loading}
            emptyMessage="Borclu müştəri tapılmadı"
          />
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-500" />
              Son Ödəmələr
            </h3>
          </div>
          <Table
            columns={paymentColumns}
            data={payments.slice(0, 20)}
            keyExtractor={(p) => p.id}
            loading={loading}
            emptyMessage="Ödəmə tapılmadı"
          />
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Borc Ödəməsi"
        size="md"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                {selectedCustomer.musteri_adi.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selectedCustomer.musteri_adi}</p>
                <p className="text-sm text-gray-500">{selectedCustomer.telefon}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Qalan Borc</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(selectedCustomer.qalan_borc)}
                </p>
              </div>
            </div>

            {/* Payment Amount */}
            <Input
              label="Ödəniləcək Məbləğ (₼)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              min={0}
              max={selectedCustomer.qalan_borc}
            />

            {/* Quick amounts */}
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentAmount(selectedCustomer.qalan_borc)}
                className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                Tam ödə
              </button>
              <button
                onClick={() => setPaymentAmount(Math.round(selectedCustomer.qalan_borc / 2))}
                className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                Yarısını ödə
              </button>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödəniş Üsulu
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMethod('Nağd')}
                  className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all
                    ${paymentMethod === 'Nağd'
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                    }`}
                >
                  <Banknote className="w-5 h-5" />
                  Nağd
                </button>
                <button
                  onClick={() => setPaymentMethod('Kart')}
                  className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all
                    ${paymentMethod === 'Kart'
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                    }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Kart
                </button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Qeyd (istəyə bağlı)
              </label>
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-green-800">Ödəniləcək:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(paymentAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-green-700">Qalan borc olacaq:</span>
                <span className="font-medium text-green-700">
                  {formatCurrency(Math.max(0, selectedCustomer.qalan_borc - paymentAmount))}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Ləğv et
              </Button>
              <Button
                className="flex-1"
                onClick={handlePayment}
                icon={<Wallet className="w-4 h-4" />}
                disabled={paymentAmount <= 0}
              >
                Ödəməni Qeyd Et
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
