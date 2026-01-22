import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Table } from '@/components/ui';
import { reportApi, categoryApi } from '@/lib/tauri';
import { formatCurrency } from '@/lib/utils';
import { Calendar, RefreshCw } from 'lucide-react';
import type { ProductStatisticsReport, ProductStatistics as ProductStatisticsType, Category } from '@/types';

export const ProductStatistics: React.FC = () => {
  const [report, setReport] = useState<ProductStatisticsReport | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
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

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoryApi.kateqoriyaSiyahisi();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportApi.mehsulStatistikasi(
        startDate || undefined,
        endDate || undefined,
        selectedCategory ?? undefined
      );
      setReport(data);
    } catch (error) {
      console.error('Error loading product statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadReport();
    }
  }, [startDate, endDate, selectedCategory]);

  // Items from report (already filtered by backend)
  const filteredItems = report?.items || [];

  // Recalculate totals based on filtered items
  const filteredTotals = React.useMemo(() => {
    const items = filteredItems;
    return {
      umumi_alis_miqdar: items.reduce((sum, i) => sum + i.toplam_alis_miqdar, 0),
      umumi_satis_miqdar: items.reduce((sum, i) => sum + i.toplam_satis_miqdar, 0),
      umumi_alis_deyeri: items.reduce((sum, i) => sum + i.toplam_alis_deyeri, 0),
      umumi_satis_deyeri: items.reduce((sum, i) => sum + i.toplam_satis_deyeri, 0),
      umumi_qazanc: items.reduce((sum, i) => sum + i.toplam_qazanc, 0),
      ortalama_qazanc_faizi: items.reduce((sum, i) => sum + i.toplam_alis_deyeri, 0) > 0
        ? (items.reduce((sum, i) => sum + i.toplam_qazanc, 0) / items.reduce((sum, i) => sum + i.toplam_alis_deyeri, 0)) * 100
        : 0,
    };
  }, [filteredItems]);

  const columns = [
    {
      key: 'mehsul_adi',
      header: 'Məhsul',
      render: (item: ProductStatisticsType) => (
        <div>
          <p className="font-medium text-gray-900">{item.mehsul_adi}</p>
          <p className="text-xs text-gray-500 font-mono">{item.barkod}</p>
        </div>
      ),
    },
    {
      key: 'toplam_alis_miqdar',
      header: 'Alış',
      render: (item: ProductStatisticsType) => (
        <div className="text-center">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
            {item.toplam_alis_miqdar} ədəd
          </span>
        </div>
      ),
    },
    {
      key: 'toplam_satis_miqdar',
      header: 'Satış',
      render: (item: ProductStatisticsType) => (
        <div className="text-center">
          <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm font-medium">
            {item.toplam_satis_miqdar} ədəd
          </span>
        </div>
      ),
    },
    {
      key: 'toplam_alis_deyeri',
      header: 'Alış Dəyəri',
      render: (item: ProductStatisticsType) => (
        <span className="text-red-600">{formatCurrency(item.toplam_alis_deyeri)}</span>
      ),
    },
    {
      key: 'toplam_satis_deyeri',
      header: 'Satış Dəyəri',
      render: (item: ProductStatisticsType) => (
        <span className="text-blue-600">{formatCurrency(item.toplam_satis_deyeri)}</span>
      ),
    },
    {
      key: 'ortalama_qazanc_vahid',
      header: 'Ort. Qazanc/Vahid',
      render: (item: ProductStatisticsType) => (
        <span className="text-purple-600">{formatCurrency(item.ortalama_qazanc_vahid)}</span>
      ),
    },
    {
      key: 'toplam_qazanc',
      header: 'Toplam Qazanc',
      render: (item: ProductStatisticsType) => (
        <span className={`font-semibold ${item.toplam_qazanc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {item.toplam_qazanc >= 0 ? '+' : ''}{formatCurrency(item.toplam_qazanc)}
        </span>
      ),
    },
    {
      key: 'hazirki_stok',
      header: 'Stok',
      render: (item: ProductStatisticsType) => (
        <span className={`px-2 py-1 rounded text-sm font-medium ${
          item.hazirki_stok > 0 ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
        }`}>
          {item.hazirki_stok}
        </span>
      ),
    },
  ];

  const StatCard = ({
    title,
    value,
    color,
    subtitle,
  }: {
    title: string;
    value: string;
    color: string;
    subtitle?: string;
  }) => (
    <div className={`rounded-xl p-3 xl:p-4 ${color}`}>
      <p className="text-[10px] xl:text-xs text-white/80 font-medium truncate">{title}</p>
      <p className="text-sm xl:text-base 2xl:text-lg font-bold text-white mt-0.5 truncate">{value}</p>
      {subtitle && (
        <p className="text-[9px] xl:text-[10px] text-white/60 mt-0.5 truncate">{subtitle}</p>
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
      <Header title="Məhsul Statistikası" />

      <div className="p-3 xl:p-6 space-y-3 xl:space-y-6">
        {/* Filters */}
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

          {/* Category Filter */}
          <div className="border-l border-gray-200 pl-2 ml-1">
            <select
              value={selectedCategory ?? ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
            >
              <option value="">Bütün Kateqoriyalar</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.ad}
                </option>
              ))}
            </select>
          </div>

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
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), 0, 1);
                setStartDate(firstDay.toISOString().split('T')[0]);
                setEndDate(now.toISOString().split('T')[0]);
              }}
              className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded"
            >
              Bu il
            </button>
            <button
              onClick={loadReport}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Cards - Smaller text, no icons */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 xl:gap-3">
          <StatCard
            title="Ümumi Alış"
            value={`${filteredTotals.umumi_alis_miqdar} ədəd`}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            subtitle="Alınan məhsul"
          />
          <StatCard
            title="Ümumi Satış"
            value={`${filteredTotals.umumi_satis_miqdar} ədəd`}
            color="bg-gradient-to-br from-green-500 to-green-600"
            subtitle="Satılan məhsul"
          />
          <StatCard
            title="Alış Dəyəri"
            value={formatCurrency(filteredTotals.umumi_alis_deyeri)}
            color="bg-gradient-to-br from-red-500 to-red-600"
            subtitle="Maya dəyəri"
          />
          <StatCard
            title="Satış Dəyəri"
            value={formatCurrency(filteredTotals.umumi_satis_deyeri)}
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            subtitle="Satış gəliri"
          />
          <StatCard
            title="Net Qazanc"
            value={formatCurrency(filteredTotals.umumi_qazanc)}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            subtitle="Satış - Maya"
          />
          <StatCard
            title="Qazanc Faizi"
            value={`${filteredTotals.ortalama_qazanc_faizi.toFixed(1)}%`}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
            subtitle="Ortalama marja"
          />
        </div>

        {/* Summary Box */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl xl:rounded-2xl p-4 xl:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm xl:text-base 2xl:text-lg font-semibold mb-1">Məhsul Statistikası Xülasəsi</h3>
              <p className="text-slate-400 text-xs">
                {report?.baslangic_tarix} — {report?.bitis_tarix}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-slate-400 text-xs">Net Qazanc</p>
              <p className={`text-xl xl:text-2xl 2xl:text-3xl font-bold ${filteredTotals.umumi_qazanc >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(filteredTotals.umumi_qazanc)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 xl:gap-4 mt-4 xl:mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-2 xl:p-3">
              <p className="text-slate-300 text-[10px] xl:text-xs">Fərqli Məhsul</p>
              <p className="text-base xl:text-lg 2xl:text-xl font-bold">{filteredItems.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-2 xl:p-3">
              <p className="text-slate-300 text-[10px] xl:text-xs">Alınan / Satılan</p>
              <p className="text-base xl:text-lg 2xl:text-xl font-bold">
                {filteredTotals.umumi_alis_miqdar} / {filteredTotals.umumi_satis_miqdar}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-2 xl:p-3">
              <p className="text-slate-300 text-[10px] xl:text-xs">Qazanc Faizi</p>
              <p className="text-base xl:text-lg 2xl:text-xl font-bold">{filteredTotals.ortalama_qazanc_faizi.toFixed(1)}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-2 xl:p-3">
              <p className="text-slate-300 text-[10px] xl:text-xs">Ort. Qazanc/Məhsul</p>
              <p className="text-base xl:text-lg 2xl:text-xl font-bold">
                {formatCurrency(
                  filteredTotals.umumi_qazanc /
                    Math.max(1, filteredTotals.umumi_satis_miqdar)
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Məhsul Bazında Statistika</h3>
            <span className="text-sm text-gray-500">
              {filteredItems.length} məhsul
            </span>
          </div>

          <Table
            columns={columns}
            data={filteredItems}
            keyExtractor={(item) => item.mehsul_id.toString()}
            emptyMessage="Seçilmiş tarix aralığında alış və ya satış tapılmadı"
          />

          {/* Table Footer with Totals */}
          {filteredItems.length > 0 && (
            <div className="px-3 xl:px-6 py-3 xl:py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap justify-end gap-4 xl:gap-8">
                <div className="text-right">
                  <p className="text-xs xl:text-sm text-gray-500">Cəmi Alış</p>
                  <p className="text-sm xl:text-lg font-bold text-blue-600">
                    {filteredTotals.umumi_alis_miqdar} ədəd
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs xl:text-sm text-gray-500">Cəmi Satış</p>
                  <p className="text-sm xl:text-lg font-bold text-green-600">
                    {filteredTotals.umumi_satis_miqdar} ədəd
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs xl:text-sm text-gray-500">Alış Dəyəri</p>
                  <p className="text-sm xl:text-lg font-bold text-red-600">
                    {formatCurrency(filteredTotals.umumi_alis_deyeri)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs xl:text-sm text-gray-500">Satış Dəyəri</p>
                  <p className="text-sm xl:text-lg font-bold text-indigo-600">
                    {formatCurrency(filteredTotals.umumi_satis_deyeri)}
                  </p>
                </div>
                <div className="text-right border-l pl-4 xl:pl-8">
                  <p className="text-xs xl:text-sm text-gray-500">Net Qazanc</p>
                  <p className="text-base xl:text-xl font-bold text-purple-600">
                    {formatCurrency(filteredTotals.umumi_qazanc)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
