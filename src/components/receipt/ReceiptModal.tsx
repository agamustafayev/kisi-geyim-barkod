import React, { useRef } from 'react';
import { Modal } from '@/components/ui';
import { Receipt } from './Receipt';
import { Printer, X } from 'lucide-react';
import { playSound } from '@/lib/utils';
import type { SaleWithItems } from '@/types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleWithItems | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!receiptRef.current) return;

    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=320,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Çek - ${sale?.satis_nomresi}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                width: 80mm;
                padding: 4mm;
              }
              * {
                font-weight: bold !important;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .font-medium { font-weight: 500; }
              .uppercase { text-transform: uppercase; }
              .text-sm { font-size: 14px; }
              .text-xs { font-size: 12px; }
              .text-gray-600 { color: #666; }
              .text-gray-500 { color: #888; }
              .border-b { border-bottom: 1px dashed #999; }
              .border-t { border-top: 1px solid #999; }
              .pb-2 { padding-bottom: 8px; }
              .pt-1 { padding-top: 4px; }
              .pt-2 { padding-top: 8px; }
              .mb-2 { margin-bottom: 8px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .mt-4 { margin-top: 16px; }
              .py-1 { padding-top: 4px; padding-bottom: 4px; }
              .ml-1 { margin-left: 4px; }
              .space-y-1 > * + * { margin-top: 4px; }
              .space-y-0\\.5 > * + * { margin-top: 2px; }
              .mt-0\\.5 { margin-top: 2px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 4px 0; }
              .leading-tight { line-height: 1.2; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .justify-center { justify-content: center; }
              .items-center { align-items: center; }
              .w-full { width: 100%; }
              .text-\\[9px\\] { font-size: 9px; }
              .text-\\[10px\\] { font-size: 10px; }
              @media print {
                body { width: 80mm; }
                @page { 
                  size: 80mm auto;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        playSound.print(); // Play sound when printing
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  if (!sale) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Satış Çeki"
      size="sm"
    >
      <div className="flex flex-col items-center">
        {/* Receipt Preview */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4 max-h-[60vh] overflow-auto">
          <div className="shadow-lg">
            <Receipt ref={receiptRef} sale={sale} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Bağla
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Önizləmə və Çap
          </button>
        </div>
      </div>
    </Modal>
  );
};
