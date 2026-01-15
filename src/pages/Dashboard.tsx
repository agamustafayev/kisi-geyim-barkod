import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { reportApi } from '@/lib/tauri';
import { useAppStore } from '@/store/appStore';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  DollarSign,
} from 'lucide-react';
import type { DailySalesReport, LowStockAlert, StockValueReport } from '@/types';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
}) => (
  <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs lg:text-sm text-gray-500 font-medium truncate">{title}</p>
        <p className="text-xl lg:text-3xl font-bold text-gray-900 mt-1 lg:mt-2 truncate">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-1 lg:mt-2">
            {trend.positive ? (
              <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4 text-green-500 flex-shrink-0" />
            ) : (
              <ArrowDownRight className="w-3 h-3 lg:w-4 lg:h-4 text-red-500 flex-shrink-0" />
            )}
            <span
              className={`text-xs lg:text-sm font-medium ${
                trend.positive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {trend.value}%
            </span>
            <span className="text-xs lg:text-sm text-gray-400 hidden sm:inline">dünənə nisbətən</span>
          </div>
        )}
      </div>
      <div
        className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        {React.cloneElement(icon as React.ReactElement, { 
          className: 'w-5 h-5 lg:w-6 lg:h-6 text-white' 
        })}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { isAdmin } = useAppStore();
  const [dailyReport, setDailyReport] = useState<DailySalesReport | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [stockValue, setStockValue] = useState<StockValueReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [daily, alerts, stockVal] = await Promise.all([
          reportApi.gunlukSatisHesabati(),
          reportApi.stokHesabati(),
          reportApi.stokDeyeriHesabati(),
        ]);
        setDailyReport(daily);
        setLowStockAlerts(alerts);
        setStockValue(stockVal);
      } catch (error) {
        console.error('Dashboard data load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Ana Səhifə" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <StatCard
            title="Bugünkü Satış"
            value={formatCurrency(dailyReport?.net_mebleg || 0)}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="Satış Sayı"
            value={String(dailyReport?.satis_sayi || 0)}
            icon={<ShoppingCart className="w-6 h-6 text-white" />}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            title="Endirim"
            value={formatCurrency(dailyReport?.endirim || 0)}
            icon={<Package className="w-6 h-6 text-white" />}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            title="Stok Xəbərdarlığı"
            value={String(lowStockAlerts.length)}
            icon={<AlertTriangle className="w-6 h-6 text-white" />}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>

        {/* Admin Only - Stock Value Cards */}
        {isAdmin() && stockValue && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="bg-white rounded-xl lg:rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Stok Alış Dəyəri</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stockValue.alis_deyeri)}</p>
                  <p className="text-xs text-gray-400 mt-1">{stockValue.toplam_stok} ədəd məhsul</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl lg:rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Stok Satış Dəyəri</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stockValue.satis_deyeri)}</p>
                  <p className="text-xs text-gray-400 mt-1">{stockValue.toplam_mehsul} fərqli məhsul</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl lg:rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Potensial Qazanc</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stockValue.potensial_qazanc)}</p>
                  <p className="text-xs text-gray-400 mt-1">Bütün stok satılarsa</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Stok Xəbərdarlıqları
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Məhsul
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Barkod
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Ölçü
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Miqdar
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Minimum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockAlerts.slice(0, 5).map((alert, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {alert.mehsul_adi}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                        {alert.barkod}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {alert.olcu}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {alert.miqdar}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {alert.minimum_miqdar}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Xoş gəlmisiniz! 👋</h2>
          <p className="text-primary-100 text-lg">
            Geyim Mağazası Barkod Sisteminə xoş gəlmisiniz. Sol menyudan
            istədiyiniz bölməyə keçid edə bilərsiniz.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <p className="text-primary-100 text-sm">F1</p>
              <p className="font-medium">Yeni Məhsul</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <p className="text-primary-100 text-sm">F2</p>
              <p className="font-medium">Satış</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <p className="text-primary-100 text-sm">F3</p>
              <p className="font-medium">Stok</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <p className="text-primary-100 text-sm">F4</p>
              <p className="font-medium">Hesabat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
