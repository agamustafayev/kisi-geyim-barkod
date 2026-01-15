import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Category, Size, Color, CartItem, ToastType, User } from '@/types';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface AppState {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdmin: () => boolean;
  logout: () => void;

  // Navigation
  activePage: string;
  setActivePage: (page: string) => void;

  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (id: number) => void;

  // Categories
  categories: Category[];
  setCategories: (categories: Category[]) => void;

  // Sizes
  sizes: Size[];
  setSizes: (sizes: Size[]) => void;

  // Colors
  colors: Color[];
  setColors: (colors: Color[]) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateCartItem: (index: number, item: CartItem) => void;
  clearCart: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;

  // Loading
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Screen Lock
  isScreenLocked: boolean;
  lockScreen: () => void;
  unlockScreen: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      isAdmin: () => get().currentUser?.rol === 'admin',
      logout: () => set({ currentUser: null, activePage: 'login' }),

      // Navigation
      activePage: 'login',
      setActivePage: (page) => set({ activePage: page }),

  // Products
  products: [],
  setProducts: (products) => set({ products }),
  addProduct: (product) =>
    set((state) => ({ products: [product, ...state.products] })),
  updateProduct: (product) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === product.id ? product : p
      ),
    })),
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  // Categories
  categories: [],
  setCategories: (categories) => set({ categories }),

  // Sizes
  sizes: [],
  setSizes: (sizes) => set({ sizes }),

  // Colors
  colors: [],
  setColors: (colors) => set({ colors }),

  // Cart
  cart: [],
  addToCart: (item) =>
    set((state) => {
      const existingIndex = state.cart.findIndex(
        (c) => c.mehsul.id === item.mehsul.id && c.olcu_id === item.olcu_id
      );
      if (existingIndex >= 0) {
        const newCart = [...state.cart];
        newCart[existingIndex].miqdar += item.miqdar;
        return { cart: newCart };
      }
      return { cart: [...state.cart, item] };
    }),
  removeFromCart: (index) =>
    set((state) => ({
      cart: state.cart.filter((_, i) => i !== index),
    })),
  updateCartItem: (index, item) =>
    set((state) => {
      const newCart = [...state.cart];
      newCart[index] = item;
      return { cart: newCart };
    }),
  clearCart: () => set({ cart: [] }),

  // Toasts
  toasts: [],
  addToast: (type, message) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: Date.now().toString(), type, message },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

      // Loading
      loading: false,
      setLoading: (loading) => set({ loading }),
      
      // Screen Lock
      isScreenLocked: false,
      lockScreen: () => set({ isScreenLocked: true }),
      unlockScreen: () => set({ isScreenLocked: false }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
