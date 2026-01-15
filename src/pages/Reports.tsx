import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Table } from '@/components/ui';
import { reportApi, paymentApi, returnApi } from '@/lib/tauri';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Percent,
  RefreshCw,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  RotateCcw,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { ProfitReport, ProfitReportItem, DailySalesReport, MonthlySalesReport, CustomerDebtSummary, Return } from '@/types';

export const Reports: React.FC = () => {
  const [profitReport, setProfitReport] = useState<ProfitReport | null>(null);
  const [dailyReport, setDailyReport] = useState<DailySalesReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlySalesReport | null>(null);
  const [debtSummaries, setDebtSummaries] = useState<CustomerDebtSummary[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Set default dates (current month)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [profit, daily, monthly, debts, returnsList] = await Promise.all([
        reportApi.qazancHesabati(startDate || undefined, endDate || undefined),
        reportApi.gunlukSatisHesabati(),
        reportApi.ayliqSatisHesabati(),
        paymentApi.musteriBorcXulasesi(),
        returnApi.iadeSiyahisi(),
      ]);
      setProfitReport(profit);
      setDailyReport(daily);
      setMonthlyReport(monthly);
      setDebtSummaries(debts);
      setReturns(returnsList);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadReports();
    }
  }, [startDate, endDate]);

  const profitMargin = profitReport
    ? ((profitReport.toplam_qazanc / profitReport.toplam_satis) * 100) || 0
    : 0;

  // Nisyə & Geri Qaytarma hesaplamaları
  const totalDebt = debtSummaries.reduce((sum, s) => sum + s.qalan_borc, 0);
  const totalPaid = debtSummaries.reduce((sum, s) => sum + s.toplam_odenis, 0);
  const totalReturns = returns.reduce((sum, r) => sum + r.toplam_mebleg, 0);

  const columns = [
    {
      key: 'mehsul_adi',
      header: 'Məhsul',
      render: (item: ProfitReportItem) => (
        <div>
          <p className="font-medium text-gray-900">{item.mehsul_adi}</p>
          <p className="text-xs text-gray-500 font-mono">{item.barkod}</p>
        </div>
      ),
    },
    {
      key: 'olcu',
      header: 'Ölçü',
      render: (item: ProfitReportItem) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm">{item.olcu}</span>
      ),
    },
    {
      key: 'miqdar',
      header: 'Satılan',
      render: (item: ProfitReportItem) => (
        <span className="font-medium">{item.miqdar} ədəd</span>
      ),
    },
    {
      key: 'alis_qiymeti',
      header: 'Alış Qiyməti',
      render: (item: ProfitReportItem) => (
        <span className="text-gray-600">{formatCurrency(item.alis_qiymeti)}</span>
      ),
    },
    {
      key: 'satis_qiymeti',
      header: 'Satış Qiyməti',
      render: (item: ProfitReportItem) => (
        <span className="text-gray-900">{formatCurrency(item.satis_qiymeti)}</span>
      ),
    },
    {
      key: 'toplam_alis',
      header: 'Cəmi Alış',
      render: (item: ProfitReportItem) => (
        <span className="text-red-600">{formatCurrency(item.toplam_alis)}</span>
      ),
    },
    {
      key: 'toplam_satis',
      header: 'Cəmi Satış',
      render: (item: ProfitReportItem) => (
        <span className="text-blue-600">{formatCurrency(item.toplam_satis)}</span>
      ),
    },
    {
      key: 'qazanc',
      header: 'Qazanc',
      render: (item: ProfitReportItem) => (
        <span className={`font-semibold ${item.qazanc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {item.qazanc >= 0 ? '+' : ''}{formatCurrency(item.qazanc)}
        </span>
      ),
    },
  ];

  const StatCard = ({
    title,
    value,
    icon,
    color,
    trend,
    subtitle,
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down';
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3 xl:p-4 2xl:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs xl:text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className="text-lg xl:text-xl 2xl:text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {subtitle && (
            <p className="text-[10px] xl:text-xs text-gray-400 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`w-8 h-8 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 rounded-lg xl:rounded-xl flex-shrink-0 flex items-center justify-center ${color}`}>
          {React.cloneElement(icon as React.ReactElement, { 
            className: 'w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 text-white' 
          })}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2 xl:mt-3">
          {trend === 'up' ? (
            <ArrowUpRight className="w-3 h-3 xl:w-4 xl:h-4 text-green-500" />
          ) : (
            <ArrowDownRight className="w-3 h-3 xl:w-4 xl:h-4 text-red-500" />
          )}
          <span className={`text-xs xl:text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {profitMargin.toFixed(1)}%
          </span>
          <span className="text-xs xl:text-sm text-gray-400 hidden xl:inline">mənfəət marjası</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Hesabatlar" />

      <div className="p-3 xl:p-6 space-y-3 xl:space-y-6">
        {/* Date Filter - Compact */}
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 flex flex-wrap items-center gap-2">
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
              onClick={loadReports}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 xl:gap-4 2xl:gap-6">
          <StatCard
            title="Ümumi Alış"
            value={formatCurrency(profitReport?.toplam_alis || 0)}
            icon={<TrendingDown />}
            color="bg-gradient-to-br from-red-500 to-red-600"
            subtitle="Maya dəyəri"
          />
          <StatCard
            title="Ümumi Satış"
            value={formatCurrency(profitReport?.toplam_satis || 0)}
            icon={<TrendingUp />}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            subtitle="Satış gəliri"
          />
          <StatCard
            title="Xam Qazanc"
            value={formatCurrency(profitReport?.toplam_qazanc || 0)}
            icon={<BarChart3 />}
            color="bg-gradient-to-br from-green-500 to-green-600"
            trend="up"
          />
          <StatCard
            title="Endirim"
            value={formatCurrency(profitReport?.toplam_endirim || 0)}
            icon={<Percent />}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
            subtitle="Tətbiq edilən"
          />
          <StatCard
            title="Net Qazanc"
            value={formatCurrency(profitReport?.net_qazanc || 0)}
            icon={<DollarSign />}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            subtitle="Xam qazanc - Endirim"
          />
        </div>

        {/* Summary Box */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl xl:rounded-2xl p-4 xl:p-6 2xl:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base xl:text-lg 2xl:text-xl font-semibold mb-1">Qazanc Xülasəsi</h3>
              <p className="text-slate-400 text-xs xl:text-sm">
                {profitReport?.baslangic_tarix} — {profitReport?.bitis_tarix}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-slate-400 text-xs xl:text-sm">Net Qazanc</p>
              <p className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-green-400">
                {formatCurrency(profitReport?.net_qazanc || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4 2xl:gap-6 mt-4 xl:mt-6 2xl:mt-8">
            <div className="bg-white/10 backdrop-blur rounded-lg xl:rounded-xl p-3 xl:p-4">
              <p className="text-slate-300 text-xs xl:text-sm">Satılan Məhsul</p>
              <p className="text-lg xl:text-xl 2xl:text-2xl font-bold">
                {profitReport?.items.reduce((sum, i) => sum + i.miqdar, 0) || 0} ədəd
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg xl:rounded-xl p-3 xl:p-4">
              <p className="text-slate-300 text-xs xl:text-sm">Məhsul Çeşidi</p>
              <p className="text-lg xl:text-xl 2xl:text-2xl font-bold">{profitReport?.items.length || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg xl:rounded-xl p-3 xl:p-4">
              <p className="text-slate-300 text-xs xl:text-sm">Mənfəət Marjası</p>
              <p className="text-lg xl:text-xl 2xl:text-2xl font-bold">{profitMargin.toFixed(1)}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg xl:rounded-xl p-3 xl:p-4">
              <p className="text-slate-300 text-xs xl:text-sm">Orta Qazanc/Məhsul</p>
              <p className="text-lg xl:text-xl 2xl:text-2xl font-bold">
                {formatCurrency(
                  (profitReport?.toplam_qazanc || 0) /
                    Math.max(1, profitReport?.items.reduce((sum, i) => sum + i.miqdar, 0) || 1)
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Profit Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Məhsul Bazında Qazanc</h3>
            </div>
            <span className="text-sm text-gray-500">
              {profitReport?.items.length || 0} məhsul
            </span>
          </div>

          <Table
            columns={columns}
            data={profitReport?.items || []}
            keyExtractor={(item) => `${item.mehsul_id}-${item.olcu}`}
            emptyMessage="Seçilmiş tarix aralığında satış tapılmadı"
          />

          {/* Table Footer with Totals */}
          {profitReport && profitReport.items.length > 0 && (
            <div className="px-3 xl:px-6 py-3 xl:py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap justify-end gap-4 xl:gap-8">
                <div className="text-right">
                  <p className="text-xs xl:text-sm text-gray-500">Cəmi Alış</p>
                  <p className="text-sm xl:text-lg font-bold text-red-600">
                    {formatCurrency(profitReport.toplam_alis)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs xl:text-sm text-gray-500">Cəmi Satış</p>
                  <p className="text-sm xl:text-lg font-bold text-blue-600">
                    {formatCurrency(profitReport.toplam_satis)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs xl:text-sm text-gray-500">Xam Qazanc</p>
                  <p className="text-sm xl:text-lg font-bold text-green-600">
                    {formatCurrency(profitReport.toplam_qazanc)}
                  </p>
                </div>
                <div className="text-right border-l pl-4 xl:pl-8">
                  <p className="text-xs xl:text-sm text-gray-500">Net Qazanc</p>
                  <p className="text-base xl:text-xl font-bold text-purple-600">
                    {formatCurrency(profitReport.net_qazanc)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Today & Monthly Quick Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 xl:gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <h4 className="font-semibold text-gray-900 mb-3 xl:mb-4 flex items-center gap-2 text-sm xl:text-base">
              <Calendar className="w-4 h-4 xl:w-5 xl:h-5" />
              Bugünkü Satış
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs xl:text-sm text-gray-500">Satış Sayı</p>
                <p className="text-xl xl:text-2xl font-bold">{dailyReport?.satis_sayi || 0}</p>
              </div>
              <div>
                <p className="text-xs xl:text-sm text-gray-500">Net Məbləğ</p>
                <p className="text-xl xl:text-2xl font-bold text-green-600">
                  {formatCurrency(dailyReport?.net_mebleg || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xl:p-6">
            <h4 className="font-semibold text-gray-900 mb-3 xl:mb-4 flex items-center gap-2 text-sm xl:text-base">
              <BarChart3 className="w-4 h-4 xl:w-5 xl:h-5" />
              Bu Aykı Satış
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs xl:text-sm text-gray-500">Satış Sayı</p>
                <p className="text-xl xl:text-2xl font-bold">{monthlyReport?.satis_sayi || 0}</p>
              </div>
              <div>
                <p className="text-xs xl:text-sm text-gray-500">Net Məbləğ</p>
                <p className="text-xl xl:text-2xl font-bold text-green-600">
                  {formatCurrency(monthlyReport?.net_mebleg || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nisyə & Geri Qaytarma Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xl:gap-6">
          {/* Nisyə (Veresiye) */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-4 xl:p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-orange-900 flex items-center gap-2 text-sm xl:text-base">
                <Wallet className="w-5 h-5" />
                Nisyə Vəziyyəti
              </h4>
              <span className="text-xs text-orange-600 bg-orange-200 px-2 py-1 rounded-full">
                {debtSummaries.filter(s => s.qalan_borc > 0).length} borclu müştəri
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-gray-500">Qalan Borc</p>
                </div>
                <p className="text-xl xl:text-2xl font-bold text-orange-600">
                  {formatCurrency(totalDebt)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-gray-500">Ödənilmiş</p>
                </div>
                <p className="text-xl xl:text-2xl font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>
            {totalDebt > 0 && (
              <div className="mt-4 p-3 bg-orange-200/50 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-700" />
                <p className="text-sm text-orange-800">
                  Yığılmalı borc: <span className="font-bold">{formatCurrency(totalDebt)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Geri Qaytarma */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-4 xl:p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-red-900 flex items-center gap-2 text-sm xl:text-base">
                <RotateCcw className="w-5 h-5" />
                Geri Qaytarma Xülasəsi
              </h4>
              <span className="text-xs text-red-600 bg-red-200 px-2 py-1 rounded-full">
                {returns.length} ümumi geri qaytarma
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Ümumi Geri Qaytarma Sayı</p>
                <p className="text-xl xl:text-2xl font-bold text-gray-900">
                  {returns.length}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Geri Qaytarma Məbləği</p>
                <p className="text-xl xl:text-2xl font-bold text-red-600">
                  -{formatCurrency(totalReturns)}
                </p>
              </div>
            </div>
            {returns.length > 0 && (
              <div className="mt-4 p-3 bg-red-200/50 rounded-lg">
                <p className="text-sm text-red-800">
                  Son geri qaytarma: <span className="font-medium">{returns[0]?.iade_nomresi}</span> 
                  {returns[0]?.musteri_adi && ` - ${returns[0].musteri_adi}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
