import React from 'react';
import { Search, Lock } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { useAppStore } from '@/store/appStore';

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onSearch,
  searchPlaceholder = 'Axtar...',
}) => {
  const { lockScreen } = useAppStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search (if provided) */}
          {onSearch && (
            <div className="w-72">
              <Input
                placeholder={searchPlaceholder}
                icon={<Search className="w-4 h-4" />}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}

          {/* Lock Screen Button */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Lock className="w-4 h-4" />}
            onClick={lockScreen}
            title="Ekranı Qıfılla"
            className="text-gray-600 hover:text-gray-900"
          >
            Qıfılla
          </Button>
        </div>
      </div>
    </header>
  );
};
