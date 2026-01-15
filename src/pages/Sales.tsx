import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Modal } from '@/components/ui';
import { ReceiptModal } from '@/components/receipt';
import { useProducts, useSales, useBarkodOxucu } from '@/hooks';
import { useAppStore } from '@/store/appStore';
import { formatCurrency, formatDate, playSound } from '@/lib/utils';
import { customerApi, saleApi } from '@/lib/tauri';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Receipt,
  Search,
  X,
  UserPlus,
  User,
  Phone,
  Clock,
  Printer,
} from 'lucide-react';
import type { Product, Stock, Sale, CartItem, Customer, CreateCustomer, SaleWithItems } from '@/types';

export const Sales: React.FC = () => {
  const { products, sizes, findByBarcode } = useProducts();
  const { cartTotal, createSale, getProductStock, loadSales } = useSales();
  const { cart, addToCart, removeFromCart, addToast } = useAppStore();

  const barkodInputRef = React.useRef<HTMLInputElement>(null);

  const [barkodSearch, setBarkodSearch] = useState(''); // Only for barcode
  const [productSearchQuery, setProductSearchQuery] = useState(''); // For product sidebar search
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productStocks, setProductStocks] = useState<Stock[]>([]);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Nağd');
  const [note, setNote] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // Receipt modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<SaleWithItems | null>(null);

  // Customer related states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CreateCustomer>({
    ad: '',
    soyad: '',
    telefon: '',
    qeyd: '',
  });
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  // Auto-focus barcode input on mount
  useEffect(() => {
    barkodInputRef.current?.focus();
  }, []);

  // Focus on Space key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only focus if Space is pressed and we're not already in an input/textarea
      if (e.code === 'Space' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        barkodInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Barcode scanner
  useBarkodOxucu({
    onScan: async (barkod) => {
      const product = await findByBarcode(barkod);
      if (product) {
        handleSelectProduct(product);
        addToast('success', `Məhsul tapıldı: ${product.ad}`);
        // Re-focus input after scan
        setTimeout(() => barkodInputRef.current?.focus(), 100);
      } else {
        addToast('warning', 'Məhsul tapılmadı');
        // Re-focus input even if not found
        setTimeout(() => barkodInputRef.current?.focus(), 100);
      }
    },
    enabled: true,
  });

  // Auto search barcode when typing
  useEffect(() => {
    const searchBarkod = async () => {
      if (barkodSearch.length >= 6) {
        const product = await findByBarcode(barkodSearch);
        if (product) {
          handleSelectProduct(product);
          setBarkodSearch('');
          addToast('success', `Məhsul tapıldı: ${product.ad}`);
          // Re-focus input after search
          setTimeout(() => barkodInputRef.current?.focus(), 100);
        }
      }
    };

    const debounce = setTimeout(searchBarkod, 500);
    return () => clearTimeout(debounce);
  }, [barkodSearch]);

  // Search customers
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearchQuery.length >= 2) {
        setCustomerSearchLoading(true);
        try {
          const results = await customerApi.musteriAxtar(customerSearchQuery);
          setCustomerSearchResults(results);
        } catch (error) {
          console.error('Error searching customers:', error);
        } finally {
          setCustomerSearchLoading(false);
        }
      } else {
        setCustomerSearchResults([]);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearchQuery]);

  // Reset customer when payment method changes
  useEffect(() => {
    if (paymentMethod !== 'Nisyə') {
      setSelectedCustomer(null);
      setCustomerSearchQuery('');
      setCustomerSearchResults([]);
    }
  }, [paymentMethod]);

  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedSize(null);

    const stocks = await getProductStock(product.id);
    setProductStocks(stocks);
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedSize) {
      addToast('warning', 'Zəhmət olmasa ölçü seçin');
      return;
    }

    const stock = productStocks.find((s) => s.olcu_id === selectedSize);
    if (!stock || stock.miqdar < quantity) {
      addToast('error', 'Stokda kifayət qədər məhsul yoxdur');
      return;
    }

    const sizeInfo = sizes.find((s) => s.id === selectedSize);
    const cartItem: CartItem = {
      mehsul: selectedProduct,
      olcu_id: selectedSize,
      olcu: sizeInfo?.olcu || '',
      miqdar: quantity,
      vahid_qiymeti: selectedProduct.satis_qiymeti,
    };

    addToCart(cartItem);
    addToast('success', 'Səbətə əlavə edildi');
    playSound.success(); // Play sound when adding to cart
    setSelectedProduct(null);
    setProductStocks([]);
    // Re-focus barcode input
    setTimeout(() => barkodInputRef.current?.focus(), 100);
  };

  const handleCheckout = async () => {
    // Validate customer for Nisyə
    if (paymentMethod === 'Nisyə' && !selectedCustomer) {
      addToast('error', 'Nisyə satış üçün müştəri seçməlisiniz');
      return;
    }

    try {
      const newSale = await createSale(
        discount,
        paymentMethod,
        note || undefined,
        paymentMethod === 'Nisyə' ? selectedCustomer?.id : undefined
      );
      setIsCheckoutOpen(false);
      setDiscount(0);
      setNote('');
      setSelectedCustomer(null);
      setCustomerSearchQuery('');

      // Open receipt modal automatically after sale
      if (newSale) {
        const saleDetails = await saleApi.satisDetallari(newSale.id);
        setReceiptSale(saleDetails);
        setIsReceiptModalOpen(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openReceiptForSale = async (saleId: number) => {
    try {
      const saleDetails = await saleApi.satisDetallari(saleId);
      setReceiptSale(saleDetails);
      setIsReceiptModalOpen(true);
    } catch (error) {
      console.error('Error loading sale for receipt:', error);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.ad || !newCustomer.soyad || !newCustomer.telefon) {
      addToast('error', 'Ad, soyad və telefon nömrəsi tələb olunur');
      return;
    }

    try {
      const customer = await customerApi.musteriElaveEt(newCustomer);
      setSelectedCustomer(customer);
      setIsNewCustomerModalOpen(false);
      setNewCustomer({ ad: '', soyad: '', telefon: '', qeyd: '' });
      addToast('success', 'Müştəri əlavə edildi');
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
  };

  // Filter products for sidebar (with stock)
  const availableProducts = products.filter(p => {
    // Filter by search query
    if (productSearchQuery.length >= 2) {
      const matchesSearch = 
        p.ad.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.barkod.includes(productSearchQuery) ||
        (p.marka && p.marka.toLowerCase().includes(productSearchQuery.toLowerCase()));
      return matchesSearch;
    }
    return true; // Show all if no search
  }).slice(0, 20); // Limit to 20 products

  const finalTotal = cartTotal - discount;

  return (
    <div className="h-screen flex flex-col">
      {/* Left Panel - Product Search & Cart */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <Header title="Satışlar" />

          <div className="p-6 flex-1 flex flex-col overflow-hidden">
          {/* Barcode Search Only */}
          <div className="relative mb-6">
            <Input
              ref={barkodInputRef}
              placeholder="Barkod oxudun..."
              icon={<Search className="w-4 h-4" />}
              value={barkodSearch}
              onChange={(e) => setBarkodSearch(e.target.value)}
              className="text-lg py-4"
            />
          </div>

          {/* Selected Product */}
          {selectedProduct && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {selectedProduct.ad}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {selectedProduct.barkod}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    // Re-focus barcode input
                    setTimeout(() => barkodInputRef.current?.focus(), 100);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Size Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ölçü Seçin
                </label>
                <div className="flex flex-wrap gap-2">
                  {productStocks.map((stock) => (
                    <button
                      key={stock.olcu_id}
                      onClick={() => setSelectedSize(stock.olcu_id)}
                      disabled={stock.miqdar === 0}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                        ${
                          selectedSize === stock.olcu_id
                            ? 'bg-primary-500 text-white border-primary-500'
                            : stock.miqdar > 0
                            ? 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                    >
                      {stock.olcu} ({stock.miqdar})
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Add */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  icon={<ShoppingCart className="w-4 h-4" />}
                  className="flex-1"
                >
                  Səbətə Əlavə Et ({formatCurrency(selectedProduct.satis_qiymeti * quantity)})
                </Button>
              </div>
            </div>
          )}

          {/* Cart */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Səbət</span>
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-sm font-medium">
                  {cart.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingCart className="w-12 h-12 mb-2" />
                  <p>Səbət boşdur</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.map((item, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.mehsul.ad}
                        </p>
                        <p className="text-sm text-gray-500">
                          Ölçü: {item.olcu} • {formatCurrency(item.vahid_qiymeti)} x{' '}
                          {item.miqdar}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(item.vahid_qiymeti * item.miqdar)}
                        </span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-4 flex-shrink-0">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium text-gray-600">Cəmi:</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <Button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-3"
                  size="lg"
                >
                  Satışı Tamamla
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Right Panel - Products List */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-4 border-b border-gray-200 space-y-3 flex-shrink-0">
            <h3 className="font-semibold text-gray-900">Məhsullar</h3>
            <Input
              placeholder="Ad və ya kod ilə axtar..."
              icon={<Search className="w-4 h-4" />}
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
          {availableProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelectProduct(product)}
              className="w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-900 text-sm">{product.ad}</p>
                <span className="font-semibold text-primary-600 text-sm">
                  {formatCurrency(product.satis_qiymeti)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-mono">{product.barkod}</p>
                {product.marka && (
                  <span className="text-xs text-gray-500">{product.marka}</span>
                )}
              </div>
              {product.kateqoriya_adi && (
                <p className="text-xs text-gray-400 mt-1">{product.kateqoriya_adi}</p>
              )}
            </button>
          ))}
            {availableProducts.length === 0 && (
              <div className="px-4 py-12 text-center text-gray-500 text-sm">
                {productSearchQuery ? 'Məhsul tapılmadı' : 'Məhsul yoxdur'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Satışı Tamamla"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Cəmi:</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Endirim:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>Yekun:</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <Input
            label="Endirim (₼)"
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ödəniş Üsulu
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod('Nağd')}
                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all
                  ${
                    paymentMethod === 'Nağd'
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                  }`}
              >
                <Banknote className="w-5 h-5" />
                Nağd
              </button>
              <button
                onClick={() => setPaymentMethod('Kart')}
                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all
                  ${
                    paymentMethod === 'Kart'
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                  }`}
              >
                <CreditCard className="w-5 h-5" />
                Kart
              </button>
              <button
                onClick={() => setPaymentMethod('Nisyə')}
                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all
                  ${
                    paymentMethod === 'Nisyə'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
                  }`}
              >
                <Clock className="w-5 h-5" />
                Nisyə
              </button>
            </div>
          </div>

          {/* Customer Selection for Nisyə */}
          {paymentMethod === 'Nisyə' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-orange-800">
                  Müştəri Seçin
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<UserPlus className="w-4 h-4" />}
                  onClick={() => setIsNewCustomerModalOpen(true)}
                >
                  Yeni Müştəri
                </Button>
              </div>

              {selectedCustomer ? (
                <div className="bg-white rounded-lg p-3 border border-orange-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedCustomer.ad} {selectedCustomer.soyad}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedCustomer.telefon}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 hover:bg-orange-100 rounded"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Ad, soyad və ya telefon ilə axtar..."
                    icon={<Search className="w-4 h-4" />}
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  />
                  {customerSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-10 max-h-48 overflow-auto">
                      {customerSearchResults.map((customer) => (
                        <button
                          key={customer.id}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {customer.ad} {customer.soyad}
                            </p>
                            <p className="text-sm text-gray-500">{customer.telefon}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {customerSearchQuery.length >= 2 && customerSearchResults.length === 0 && !customerSearchLoading && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-center text-gray-500">
                      Müştəri tapılmadı
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Qeyd (istəyə bağlı)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsCheckoutOpen(false)}
            >
              Ləğv et
            </Button>
            <Button
              className="flex-1"
              onClick={handleCheckout}
              icon={<Receipt className="w-4 h-4" />}
              disabled={paymentMethod === 'Nisyə' && !selectedCustomer}
            >
              Satışı Tamamla
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Customer Modal */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Yeni Müştəri Əlavə Et"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ad *"
              value={newCustomer.ad}
              onChange={(e) => setNewCustomer({ ...newCustomer, ad: e.target.value })}
              placeholder="Ad"
            />
            <Input
              label="Soyad *"
              value={newCustomer.soyad}
              onChange={(e) => setNewCustomer({ ...newCustomer, soyad: e.target.value })}
              placeholder="Soyad"
            />
          </div>
          <Input
            label="Telefon Nömrəsi *"
            value={newCustomer.telefon}
            onChange={(e) => setNewCustomer({ ...newCustomer, telefon: e.target.value })}
            placeholder="+994 XX XXX XX XX"
            icon={<Phone className="w-4 h-4" />}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Qeyd (istəyə bağlı)
            </label>
            <textarea
              value={newCustomer.qeyd || ''}
              onChange={(e) => setNewCustomer({ ...newCustomer, qeyd: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Əlavə qeydlər..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsNewCustomerModalOpen(false)}
            >
              Ləğv et
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateCustomer}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Əlavə Et
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sale Details Modal */}
      <Modal
        isOpen={!!viewingSale}
        onClose={() => setViewingSale(null)}
        title={`Satış: ${viewingSale?.satis_nomresi}`}
        size="md"
      >
        {viewingSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tarix</p>
                <p className="font-medium">{formatDate(viewingSale.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Ödəniş Üsulu</p>
                <p className="font-medium">{viewingSale.odenis_usulu}</p>
              </div>
              {viewingSale.musteri_adi && (
                <div className="col-span-2">
                  <p className="text-gray-500">Müştəri</p>
                  <p className="font-medium">{viewingSale.musteri_adi}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Cəmi</p>
                <p className="font-medium">{formatCurrency(viewingSale.toplam_mebleg)}</p>
              </div>
              <div>
                <p className="text-gray-500">Endirim</p>
                <p className="font-medium">{formatCurrency(viewingSale.endirim)}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Yekun Məbləğ:</span>
                <span className="text-primary-600">{formatCurrency(viewingSale.son_mebleg)}</span>
              </div>
            </div>
            <div className="pt-4">
              <Button
                variant="primary"
                className="w-full"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => openReceiptForSale(viewingSale.id)}
              >
                Çek Çap Et
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={receiptSale}
      />
    </div>
  );
};
