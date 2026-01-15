import { useState, useCallback } from 'react';
import { saleApi, stockApi } from '@/lib/tauri';
import { useAppStore } from '@/store/appStore';
import type { Sale, CreateSale, Stock } from '@/types';

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const { cart, clearCart, addToast, setLoading } = useAppStore();

  // Load sales
  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const salesData = await saleApi.satisSiyahisi();
      setSales(salesData);
    } catch (error) {
      addToast('error', 'Satışlar yüklənə bilmədi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [addToast, setLoading]);

  // Load stocks
  const loadStocks = useCallback(async () => {
    try {
      const stocksData = await stockApi.stokSiyahisi();
      setStocks(stocksData);
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Create sale
  const createSale = async (
    endirim: number = 0,
    odenis_usulu: string = 'Nağd',
    qeyd?: string,
    musteri_id?: number
  ) => {
    if (cart.length === 0) {
      addToast('warning', 'Səbət boşdur!');
      return null;
    }

    const saleData: CreateSale = {
      items: cart.map((item) => ({
        mehsul_id: item.mehsul.id,
        olcu_id: item.olcu_id,
        miqdar: item.miqdar,
        vahid_qiymeti: item.vahid_qiymeti,
      })),
      endirim,
      odenis_usulu,
      musteri_id: musteri_id || null,
      qeyd,
    };

    try {
      const sale = await saleApi.satisYarat(saleData);
      clearCart();
      const successMsg = odenis_usulu === 'Nisyə' 
        ? `Nisyə satış uğurla yaradıldı! №${sale.satis_nomresi}`
        : `Satış uğurla tamamlandı! №${sale.satis_nomresi}`;
      addToast('success', successMsg);
      await loadSales();
      return sale;
    } catch (error) {
      addToast('error', 'Satış yaradıla bilmədi');
      throw error;
    }
  };

  // Get sale details
  const getSaleDetails = async (satis_id: number) => {
    try {
      const details = await saleApi.satisDetallari(satis_id);
      return details;
    } catch (error) {
      addToast('error', 'Satış detalları yüklənə bilmədi');
      throw error;
    }
  };

  // Get stock for product
  const getProductStock = async (mehsul_id: number) => {
    try {
      const productStocks = await stockApi.stokMehsulUcun(mehsul_id);
      return productStocks;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  // Calculate cart total
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.vahid_qiymeti * item.miqdar,
    0
  );

  return {
    sales,
    stocks,
    cart,
    cartTotal,
    loadSales,
    loadStocks,
    createSale,
    getSaleDetails,
    getProductStock,
  };
};
