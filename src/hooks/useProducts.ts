import { useEffect, useCallback } from 'react';
import { productApi, categoryApi, sizeApi, colorApi } from '@/lib/tauri';
import { useAppStore } from '@/store/appStore';
import type { CreateProduct, UpdateProduct } from '@/types';

export const useProducts = () => {
  const {
    products,
    setProducts,
    addProduct,
    updateProduct,
    removeProduct,
    categories,
    setCategories,
    sizes,
    setSizes,
    colors,
    setColors,
    addToast,
    setLoading,
  } = useAppStore();

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData, sizesData, colorsData] = await Promise.all([
        productApi.mehsulSiyahisi(),
        categoryApi.kateqoriyaSiyahisi(),
        sizeApi.olcuSiyahisi(),
        colorApi.rengSiyahisi(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setSizes(sizesData);
      setColors(colorsData);
    } catch (error) {
      addToast('error', 'Məlumatlar yüklənə bilmədi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [setProducts, setCategories, setSizes, setColors, addToast, setLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add product
  const createProduct = async (data: CreateProduct) => {
    try {
      const product = await productApi.mehsulElaveEt(data);
      addProduct(product);
      addToast('success', 'Məhsul uğurla əlavə edildi!');
      return product;
    } catch (error) {
      addToast('error', 'Məhsul əlavə edilə bilmədi');
      throw error;
    }
  };

  // Update product
  const editProduct = async (id: number, data: UpdateProduct) => {
    try {
      const product = await productApi.mehsulYenile(id, data);
      updateProduct(product);
      addToast('success', 'Məhsul uğurla yeniləndi!');
      return product;
    } catch (error) {
      addToast('error', 'Məhsul yenilənə bilmədi');
      throw error;
    }
  };

  // Delete product
  const deleteProduct = async (id: number) => {
    try {
      await productApi.mehsulSil(id);
      removeProduct(id);
      addToast('success', 'Məhsul uğurla silindi!');
    } catch (error) {
      addToast('error', 'Məhsul silinə bilmədi');
      throw error;
    }
  };

  // Search products
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      await loadData();
      return;
    }
    try {
      const results = await productApi.mehsulAxtar(query);
      setProducts(results);
    } catch (error) {
      addToast('error', 'Axtarış zamanı xəta baş verdi');
      console.error(error);
    }
  };

  // Search by barcode
  const findByBarcode = async (barcode: string) => {
    try {
      const product = await productApi.mehsulBarkodIleAxtar(barcode);
      return product;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  return {
    products,
    categories,
    sizes,
    colors,
    loadData,
    createProduct,
    editProduct,
    deleteProduct,
    searchProducts,
    findByBarcode,
  };
};
