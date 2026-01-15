import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: string; // Optional custom sort key if different from 'key'
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  showPagination?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Məlumat tapılmadı',
  loading = false,
  onRowClick,
  pageSize = 20,
  showPagination = true,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Reset to page 1 when data changes
  useMemo(() => {
    setCurrentPage(1);
  }, [data.length]);

  // Handle sort
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    
    const key = column.sortKey || column.key;
    
    if (sortKey === key) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column
      setSortKey(key);
      setSortDirection('asc');
    }
    
    // Reset to first page when sorting
    setCurrentPage(1);
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    
    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, any>)[sortKey];
      const bValue = (b as Record<string, any>)[sortKey];
      
      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'az');
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'az');
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => {
                const isActive = sortKey === (column.sortKey || column.key);
                return (
                  <th
                    key={column.key}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                      column.sortable && 'cursor-pointer select-none hover:bg-gray-100 transition-colors',
                      column.className
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {column.sortable && (
                        <span className="flex-shrink-0">
                          {!isActive && <ArrowUpDown className="w-4 h-4 text-gray-400" />}
                          {isActive && sortDirection === 'asc' && <ArrowUp className="w-4 h-4 text-primary-600" />}
                          {isActive && sortDirection === 'desc' && <ArrowDown className="w-4 h-4 text-primary-600" />}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-50'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(item)
                        : String((item as Record<string, unknown>)[column.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && sortedData.length > pageSize && (
        <div className="flex items-center justify-between px-2">
          {/* Info */}
          <div className="text-sm text-gray-500">
            <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
            {' - '}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>
            {' / '}
            <span className="font-medium">{sortedData.length}</span>
            {' nəticə'}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* First */}
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="İlk səhifə"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Əvvəlki"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Növbəti"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last */}
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Son səhifə"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="text-sm text-gray-500">
            Səhifə {currentPage} / {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
