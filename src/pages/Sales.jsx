import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Trash2, X, CheckCircle2, CreditCard, Wallet, Banknote, Printer, Search, ArrowRight } from 'lucide-react';
import { subscribeProducts, createSale } from '../firebase/db';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

const Receipt = ({ sale, lang, t }) => {
  if (!sale) return null;
  
  return (
    <div id="printable-receipt" className="print-only p-8 text-black font-mono text-sm leading-tight bg-white">
      <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase">{t('title')}</h1>
        <p className="text-xs mt-1">123 Market Street, Tamil Nadu</p>
        <p className="text-xs">Ph: +91 98765 43210</p>
        <p className="text-[10px] mt-1 font-bold">GSTIN: 33AAAAA0000A1Z5</p>
      </div>
      
      <div className="flex justify-between mb-2">
        <span>{t('bill_no')}: {sale.id?.slice(-6).toUpperCase()}</span>
        <span>{t('date')}: {new Date().toLocaleDateString()}</span>
      </div>
      <div className="mb-4">
        <span>{t('payment_method')}: {t(sale.payment_method)}</span>
      </div>
      
      <div className="border-b border-dashed border-gray-400 mb-2 pb-1 flex font-bold">
        <span className="flex-1">{t('items')}</span>
        <span className="w-12 text-right">Qty</span>
        <span className="w-16 text-right">Price</span>
      </div>
      
      <div className="space-y-1 mb-4">
        {sale.products.map((item, idx) => (
          <div key={idx} className="flex">
            <span className="flex-1">{item.name}</span>
            <span className="w-12 text-right">{item.quantity}</span>
            <span className="w-16 text-right">₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>
      
      <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span>{t('taxable_amount')}</span>
          <span>₹{sale.taxable_amount?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>{t('gst')} (5%)</span>
          <span>₹{sale.gst_amount?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-1 border-t border-gray-200">
          <span>{t('grand_total')}</span>
          <span>₹{sale.total_amount?.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="text-center mt-8 pt-4 border-t border-dashed border-gray-400">
        <p className="italic">{t('thank_you')}</p>
        <p className="text-[10px] mt-2 opacity-50">Powered by Antigravity POS</p>
      </div>
    </div>
  );
};

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(0); // 0 = All
  const [showCart, setShowCart] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(null); // 'loading', 'success', 'error'
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [lastSale, setLastSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const GST_RATE = 0.05; // 5% GST
  
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const decrementFromCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter(item => item.id !== productId);
      }
      return prev.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstAmount = subtotal * GST_RATE;
  const totalAmount = subtotal + gstAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setCheckoutStatus('loading');
    const saleData = {
      products: cart.map(item => ({
        id: item.id,
        name: lang === 'en' ? item.name_en : item.name_ta,
        quantity: item.quantity,
        price: item.price
      })),
      taxable_amount: subtotal,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod
    };

    const result = await createSale(saleData, user.uid);
    
    if (result.success) {
      setCheckoutStatus('success');
      const completedSale = { ...saleData, id: result.saleId };
      setLastSale(completedSale);
      
      // Auto-trigger print
      setTimeout(() => {
        window.print();
        setCart([]);
        // fetchProducts() is no longer needed due to subscribeProducts
        setCheckoutStatus(null);
        setShowCart(false);
      }, 500);
    } else {
      setCheckoutStatus('error');
      alert(result.error);
      setTimeout(() => setCheckoutStatus(null), 3000);
    }
  };

  const categories = [
    { id: 0, name: 'All' },
    { id: 5, name: 'Vegetable' },
    { id: 6, name: 'Mushroom' },
    { id: 7, name: 'Dairy' },
    { id: 8, name: 'Groceries' }
  ];

  const paymentMethods = [
    { id: 'cash', icon: <Banknote size={20} />, label: t('cash'), color: 'bg-green-50 text-green-600 border-green-200' },
    { id: 'gpay', icon: <Wallet size={20} />, label: t('gpay'), color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'card', icon: <CreditCard size={20} />, label: t('card'), color: 'bg-purple-50 text-purple-600 border-purple-200' }
  ];

  const filteredProducts = products.filter(p => {
    const matchesCategory = category === 0 || p.category === category;
    const matchesSearch = p.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.name_ta.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100-64px)] pb-24 md:pb-8">
      {/* Hidden Receipt for Printing */}
      <Receipt sale={lastSale} lang={lang} t={t} />

      {/* Search and Category Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={lang === 'en' ? "Search products..." : "பொருட்களைத் தேடுக..."}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    category === cat.id 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat.id === 0 ? (lang === 'en' ? 'All' : 'அனைத்தும்') : cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-xl sm:rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <Search size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-500 font-bold">
                  {lang === 'en' ? "No products found." : "பொருட்கள் எதுவும் காணப்படவில்லை."}
                </p>
                <p className="text-gray-400 text-sm">
                  {lang === 'en' ? "Try a different search term or category." : "வேறு தேடல் சொல் அல்லது வகையை முயற்சிக்கவும்."}
                </p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  addToCart={addToCart}
                  decrementFromCart={decrementFromCart}
                  cartQuantity={cart.find(c => c.id === product.id)?.quantity || 0}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Cart Floating Button (Mobile) */}
      <div className="md:hidden">
        {cart.length > 0 && !showCart && (
          <button
            onClick={() => setShowCart(true)}
            className="fixed bottom-20 right-4 bg-secondary text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce cursor-pointer z-50 farmer-touch"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-secondary font-black">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <span className="font-black text-lg">₹{totalAmount.toFixed(0)}</span>
          </button>
        )}
      </div>

      {/* Cart Sidebar/Modal */}
      {(showCart || (cart.length > 0 && true)) && (
        <div className={`fixed inset-0 z-[60] md:relative md:inset-auto md:z-10 ${showCart ? 'flex' : 'hidden md:flex'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setShowCart(false)}></div>
          
          <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[85%] sm:max-w-md bg-white shadow-2xl flex flex-col md:fixed md:top-16 md:right-0 md:h-[calc(100vh-64px)] md:w-80 lg:w-96 transition-transform duration-300 ease-out ${showCart ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-black flex items-center gap-2 text-primary">
                <ShoppingCart className="w-6 h-6" /> {t('cart')}
              </h2>
              <div className="flex gap-1 sm:gap-2">
                {lastSale && (
                  <button 
                    onClick={() => window.print()} 
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                    title={t('print_bill')}
                  >
                    <Printer size={20} />
                  </button>
                )}
                <button onClick={() => setShowCart(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/50">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-300">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={32} className="opacity-20" />
                  </div>
                  <p className="font-bold text-gray-400">{t('empty_cart')}</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 sm:gap-4 bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-sm transition-all">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400'} 
                      alt="" 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shadow-inner" 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400';
                        e.target.onerror = null;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{lang === 'en' ? item.name_en : item.name_ta}</h4>
                      <p className="text-primary font-black text-sm">₹{item.price}</p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                        <button 
                          onClick={() => decrementFromCart(item.id)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center font-bold active:bg-gray-100 transition-colors"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center font-bold active:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-accent transition-colors self-start p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-100 bg-white">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">{t('payment_method')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl border-2 transition-all gap-1 ${
                        paymentMethod === method.id 
                          ? `${method.color.split(' ')[2]} ${method.color.split(' ')[0]} border-current shadow-sm` 
                          : 'border-gray-50 text-gray-300 grayscale opacity-60'
                      }`}
                    >
                      {React.cloneElement(method.icon, { size: 18 })}
                      <span className="text-[9px] font-black uppercase tracking-tighter">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">{t('taxable_amount')}</span>
                  <span className="font-bold text-gray-600">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">{t('gst')} (5%)</span>
                  <span className="font-bold text-gray-600">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-gray-50">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t('grand_total')}</span>
                  <span className="text-2xl sm:text-3xl font-black text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutStatus === 'loading'}
                className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-white text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${
                  checkoutStatus === 'success' 
                    ? 'bg-green-500' 
                    : checkoutStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-primary hover:bg-primary-dark shadow-xl shadow-primary/30 active:scale-[0.98]'
                }`}
              >
                {checkoutStatus === 'loading' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                ) : checkoutStatus === 'success' ? (
                  <><CheckCircle2 size={20} /> {t('success')}</>
                ) : checkoutStatus === 'error' ? (
                  'Error!'
                ) : (
                  <span className="flex items-center gap-2">{t('checkout')} <ArrowRight size={20} /></span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
