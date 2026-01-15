import React from 'react';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useAppStore } from '@/store/appStore';
import { Lock } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activePage,
  onNavigate,
}) => {
  useIdleDetection(180000); // 3 minutes
  const { isScreenLocked, unlockScreen } = useAppStore();

  const handleUnlock = () => {
    unlockScreen();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      {/* Screen Lock Overlay */}
      {isScreenLocked && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-500"
          style={{
            backdropFilter: 'blur(25px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent any click from propagating
        >
          <div className="text-center text-white pointer-events-none">
            <button
              onClick={handleUnlock}
              className="inline-flex items-center justify-center w-28 h-28 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm mb-6 transition-all duration-200 transform hover:scale-110 pointer-events-auto cursor-pointer shadow-2xl"
            >
              <Lock className="w-14 h-14" />
            </button>
            <p className="text-2xl font-bold drop-shadow-lg">Ekran Qıfıldı</p>
            <p className="text-base text-white/90 mt-3 drop-shadow">Açmaq üçün kilit ikonuna klik edin</p>
          </div>
        </div>
      )}
    </div>
  );
};
