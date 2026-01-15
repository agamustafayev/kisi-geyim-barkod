import { forwardRef, useEffect, useState } from 'react';
import { settingsApi } from '@/lib/tauri';
import { formatCurrency } from '@/lib/utils';
import type { Settings, SaleWithItems } from '@/types';

interface ReceiptProps {
  sale: SaleWithItems;
  onPrint?: () => void;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ sale }, ref) => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    settingsApi.parametrleriAl().then(setSettings).catch(console.error);
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('az-AZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      ref={ref}
      className="bg-white font-mono text-xs"
      style={{
        width: '80mm',
        minHeight: '30mm',
        padding: '4mm',
        boxSizing: 'border-box',
      }}
    >
      {/* Header - Store Info */}
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <h1 className="text-sm font-bold uppercase">
          {settings?.magaza_adi || 'Geyim'}
        </h1>

        {/* Address */}
        {settings?.adres && (
          <p className="text-[10px] text-gray-600 mt-1 font-bold">{settings.adres}</p>
        )}

        {/* Phone */}
        {settings?.telefon && (
          <p className="text-[10px] text-gray-600 mt-0.5 font-bold">Tel: {settings.telefon}</p>
        )}

        {/* Social Media */}
        {(settings?.whatsapp || settings?.instagram || settings?.tiktok) && (
          <div className="text-[9px] text-gray-500 mt-1 space-y-0.5 font-bold">
            {settings.whatsapp && (
              <p>WhatsApp: {settings.whatsapp}</p>
            )}
            {settings.instagram && (
              <p>Instagram: {settings.instagram}</p>
            )}
            {settings.tiktok && (
              <p>TikTok: {settings.tiktok}</p>
            )}
          </div>
        )}
      </div>

      {/* Receipt Info */}
      <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
        <div className="flex justify-between">
          <span className="text-gray-600 font-bold">Çek №:</span>
          <span className="font-bold">{sale.satis_nomresi}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 font-bold">Tarix:</span>
          <span className="font-bold">{formatDate(sale.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 font-bold">Ödəniş:</span>
          <span className="font-bold">{sale.odenis_usulu}</span>
        </div>
      </div>

      {/* Items */}
      <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
        <table className="w-full">
          <thead>
            <tr className="text-gray-600 border-b border-gray-300">
              <th className="text-left py-1 font-bold">Məhsul</th>
              <th className="text-right py-1 font-bold">Say</th>
              <th className="text-right py-1 font-bold">Qiy.</th>
              <th className="text-right py-1 font-bold">Cəm</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-1">
                  <div className="text-[10px] leading-tight font-bold">
                    {item.mehsul_adi}
                    <span className="text-gray-500 ml-1">({item.olcu})</span>
                  </div>
                </td>
                <td className="text-right py-1 font-bold">{item.miqdar}</td>
                <td className="text-right py-1 font-bold">{item.vahid_qiymeti.toFixed(2)}</td>
                <td className="text-right py-1 font-bold">{item.toplam_qiymet.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between font-bold">
          <span>Cəmi:</span>
          <span>{formatCurrency(sale.toplam_mebleg)}</span>
        </div>
        {sale.endirim > 0 && (
          <div className="flex justify-between text-gray-600 font-bold">
            <span>Endirim:</span>
            <span>-{formatCurrency(sale.endirim)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold border-t border-gray-400 pt-1">
          <span>YEKUN:</span>
          <span>{formatCurrency(sale.son_mebleg)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-400">
        <p className="text-[10px] text-gray-600 font-bold">Alış-verişiniz üçün təşəkkür edirik!</p>
        <p className="text-[10px] text-gray-500 mt-1 font-bold">Yenidən gözləyirik</p>
        <div className="mt-2 flex justify-center">
          <div className="w-16 h-1 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
