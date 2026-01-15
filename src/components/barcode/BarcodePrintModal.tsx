import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { BarcodeLabel } from './BarcodeLabel';
import { Printer, X, Plus, Minus } from 'lucide-react';
import { stockApi, sizeApi } from '@/lib/tauri';
import type { Product, Stock, Size } from '@/types';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [showPrice, setShowPrice] = useState(false); // Default: price not shown
  const [showProductName, setShowProductName] = useState(true); // Default: show product name
  const [showStoreName, setShowStoreName] = useState(false); // Default: store name not shown

  useEffect(() => {
    const loadData = async () => {
      if (product) {
        try {
          const [stockData, sizeData] = await Promise.all([
            stockApi.stokMehsulUcun(product.id),
            sizeApi.olcuSiyahisi(),
          ]);
          setStocks(stockData);
          setSizes(sizeData);
          
          // Default select first size with stock
          const firstWithStock = stockData.find(s => s.miqdar > 0);
          if (firstWithStock) {
            const size = sizeData.find(s => s.id === firstWithStock.olcu_id);
            setSelectedSize(size?.olcu || '');
          }
        } catch (error) {
          console.error('Error loading stock data:', error);
        }
      }
    };
    
    if (isOpen && product) {
      loadData();
      setQuantity(1);
    }
  }, [isOpen, product]);

  const handlePrint = () => {
    if (!labelRef.current) return;

    const printContent = labelRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=300');

    if (printWindow) {
      // Generate multiple labels based on quantity
      let labelsHtml = '';
      for (let i = 0; i < quantity; i++) {
        labelsHtml += `<div class="label-container">${printContent}</div>`;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barkod - ${product?.barkod}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: Arial, sans-serif;
              }
              .label-container {
                width: 50mm;
                height: 30mm;
                padding: 2mm;
                page-break-after: always;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
              }
              .label-container:last-child {
                page-break-after: avoid;
              }
              .text-center { text-align: center; }
              .flex { display: flex; }
              .justify-center { justify-content: center; }
              svg {
                max-width: 45mm;
                height: auto;
              }
              @media print {
                @page {
                  size: 50mm 30mm;
                  margin: 0;
                }
                body {
                  width: 50mm;
                }
              }
            </style>
          </head>
          <body>
            ${labelsHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  if (!product) return null;

  // Get available sizes from stock
  const availableSizes = stocks
    .filter(s => s.miqdar > 0)
    .map(s => {
      const size = sizes.find(sz => sz.id === s.olcu_id);
      return size?.olcu || '';
    })
    .filter(Boolean);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Barkod Çap Et" size="md">
      <div className="space-y-6">
        {/* Product Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900">{product.ad}</h4>
          <p className="text-sm text-gray-500 font-mono mt-1">{product.barkod}</p>
          <p className="text-lg font-bold text-primary-600 mt-2">
            {product.satis_qiymeti.toFixed(2)} ₼
          </p>
        </div>

        {/* Size Selection */}
        {availableSizes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ölçü Seçin (istəyə bağlı)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSize('')}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
                  ${!selectedSize
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-500'
                  }`}
              >
                Ölçüsüz
              </button>
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
                    ${selectedSize === size
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-primary-500'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Display Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Görüntü Seçimləri
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={(e) => setShowStoreName(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Mağaza Adı</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showProductName}
                onChange={(e) => setShowProductName(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Məhsul Adı</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Qiymət</span>
            </label>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Çap Sayı
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg"
              min={1}
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => setQuantity(5)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                5
              </button>
              <button
                onClick={() => setQuantity(10)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                10
              </button>
              <button
                onClick={() => setQuantity(20)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                20
              </button>
            </div>
          </div>
        </div>

        {/* Label Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Önizləmə (50mm x 30mm)
          </label>
          <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
            <div className="shadow-lg border border-gray-300">
              <BarcodeLabel
                ref={labelRef}
                product={product}
                size={selectedSize}
                showPrice={showPrice}
                showProductName={showProductName}
                showStoreName={showStoreName}
              />
            </div>
          </div>
        </div>




        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Bağla
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Önizləmə və Çap
          </Button>
        </div>
      </div>
    </Modal>
  );
};
