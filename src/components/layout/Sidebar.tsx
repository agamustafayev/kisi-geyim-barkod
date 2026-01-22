import React from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Settings,
  Shirt,
  ListOrdered,
  PieChart,
  Users,
  Wallet,
  RotateCcw,
  LogOut,
  Shield,
  User,
  UsersRound,
  Tag,
  Palette,
  BarChart2,
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { currentUser, isAdmin, logout } = useAppStore();

  // Base menu items (available to all)
  const baseMenuItems = [
    { id: 'dashboard', label: 'Ana Səhifə', icon: LayoutDashboard },
    { id: 'products', label: 'Məhsullar', icon: Package },
    { id: 'sales', label: 'Satış Et', icon: ShoppingCart },
    { id: 'saleslist', label: 'Satış Siyahısı', icon: ListOrdered },
    { id: 'customers', label: 'Müştərilər', icon: Users },
    { id: 'debtpayments', label: 'Nisyə Ödəmə', icon: Wallet },
    { id: 'returns', label: 'Geri Qaytarma', icon: RotateCcw },
    { id: 'stock', label: 'Stok', icon: Warehouse },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { id: 'productstatistics', label: 'Məhsul Statistikası', icon: BarChart2 },
    { id: 'reports', label: 'Hesabatlar', icon: PieChart },
    { id: 'categories', label: 'Kateqoriyalar', icon: Tag },
    { id: 'colors', label: 'Rənglər', icon: Palette },
    { id: 'sizes', label: 'Ölçülər', icon: Tag },
    { id: 'users', label: 'İstifadəçilər', icon: UsersRound },
  ];

  const menuItems = isAdmin() ? [...baseMenuItems, ...adminMenuItems] : baseMenuItems;

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 h-screen sticky top-0 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Shirt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Geyim</h1>
            <p className="text-slate-400 text-xs">Barkod Sistemi</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isAdmin()
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {isAdmin() ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {currentUser.ad} {currentUser.soyad}
              </p>
              <p className="text-slate-400 text-xs">
                {isAdmin() ? 'Admin' : 'İşçi'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200',
                    'text-sm font-medium',
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        {/* Settings (Admin only) */}
        {isAdmin() && (
          <button
            onClick={() => onNavigate('settings')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium',
              activePage === 'settings'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
          >
            <Settings className="w-5 h-5" />
            Parametrlər
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          Çıxış
        </button>
      </div>
    </aside>
  );
};
