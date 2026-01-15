import React, { forwardRef, useEffect, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { settingsApi } from '@/lib/tauri';
import { formatCurrency } from '@/lib/utils';
import type { Settings, Product } from '@/types';

interface BarcodeLabelProps {
  product: Product;
  size?: string; // Ölçü (S, M, L, XL, 42, 44 etc.)
  showPrice?: boolean; // Qiyməti göstər (default: true)
  showProductName?: boolean; // Məhsul adını göstər (default: true)
  showStoreName?: boolean; // Mağaza adını göstər (default: false)
}

export const BarcodeLabel = forwardRef<HTMLDivElement, BarcodeLabelProps>(
  ({ product, size, showPrice = true, showProductName = true, showStoreName = false }, ref) => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const barcodeRef = React.useRef<SVGSVGElement>(null);

    useEffect(() => {
      settingsApi.parametrleriAl().then(setSettings).catch(console.error);
    }, []);

    useEffect(() => {
      if (barcodeRef.current && product.barkod) {
        try {
          JsBarcode(barcodeRef.current, product.barkod, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5,
            textMargin: 2,
          });
        } catch (error) {
          console.error('Barkod yaradıla bilmədi:', error);
        }
      }
    }, [product.barkod]);

    return (
      <div
        ref={ref}
        className="bg-white"
        style={{
          width: '55mm',
          height: '35mm',
          padding: '2mm',
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Store Name (optional) */}
        {showStoreName && (
          <div className="text-center" style={{ fontSize: '8px', fontWeight: 'bold' }}>
            {settings?.magaza_adi || 'Geyim'}
          </div>
        )}

        {/* Product Name (optional) */}
        {showProductName && (
          <div
            className="text-center"
            style={{
              fontSize: '9px',
              fontWeight: '600',
              marginTop: '1mm',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {product.ad}
          </div>
        )}

        {/* Size if provided */}
        {size && (
          <div className="text-center" style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '0.5mm' }}>
            Ölçü: {size}
          </div>
        )}

        {/* Barcode */}
        <div className="flex justify-center" style={{ marginTop: '1mm' }}>
          <svg ref={barcodeRef} />
        </div>

        {/* Price (optional) */}
        {showPrice && (
          <div
            className="text-center"
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginTop: '1mm',
            }}
          >
            {formatCurrency(product.satis_qiymeti)}
          </div>
        )}
      </div>
    );
  }
);

BarcodeLabel.displayName = 'BarcodeLabel';
