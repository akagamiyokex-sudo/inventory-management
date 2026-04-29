import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Trash2, X, CheckCircle2, CreditCard, Wallet, Banknote, Printer } from 'lucide-react';
import { getProducts, createSale } from '../firebase/db';
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
  const GST_RATE = 0.05; // 5% GST
  
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

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
        fetchProducts(); // Refresh stock
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

  const filteredProducts = category === 0 
    ? products 
    : products.filter(p => p.category === category);

  return (
    <div className="min-h-[calc(100-64px)] pb-24 md:pb-8">
      {/* Hidden Receipt for Printing */}
      <Receipt sale={lastSale} lang={lang} t={t} />

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40 overflow-x-auto no-scrollbar">
        <div className="flex px-4 py-3 gap-2 min-w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                addToCart={addToCart}
                cartQuantity={cart.find(c => c.id === product.id)?.quantity || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Floating Button (Mobile) */}
      <div className="md:hidden">
        {cart.length > 0 && !showCart && (
          <button
            onClick={() => setShowCart(true)}
            className="fixed bottom-20 right-6 bg-secondary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 animate-bounce cursor-pointer z-50"
          >
            <ShoppingCart size={24} />
            <span className="font-black">₹{totalAmount.toFixed(2)}</span>
          </button>
        )}
      </div>

      {/* Cart Sidebar/Modal */}
      {(showCart || (cart.length > 0 && true)) && (
        <div className={`fixed inset-0 z-[60] md:relative md:inset-auto md:z-10 ${showCart ? 'flex' : 'hidden md:flex'}`}>
          <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setShowCart(false)}></div>
          
          <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col md:fixed md:top-16 md:right-0 md:h-[calc(100vh-64px)] md:w-96 transition-transform duration-300 ${showCart ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center text-primary">
              <h2 className="text-xl font-black flex items-center gap-2">
                <ShoppingCart /> {t('cart')}
              </h2>
              <div className="flex gap-2">
                {lastSale && (
                  <button 
                    onClick={() => window.print()} 
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                    title={t('print_bill')}
                  >
                    <Printer size={20} />
                  </button>
                )}
                <button onClick={() => setShowCart(false)} className="md:hidden p-2">
                  <X />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">{t('empty_cart')}</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400'} 
                      alt="" 
                      className="w-16 h-16 rounded-lg object-cover" 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400';
                        e.target.onerror = null;
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{lang === 'en' ? item.name_en : item.name_ta}</h4>
                      <p className="text-primary font-black">₹{item.price}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-accent transition-colors self-start"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">{t('payment_method')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${
                        paymentMethod === method.id 
                          ? `${method.color.split(' ')[2]} ${method.color.split(' ')[0]} border-current` 
                          : 'border-gray-100 text-gray-400 grayscale'
                      }`}
                    >
                      {method.icon}
                      <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 border-t border-gray-100 bg-white space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-wider">{t('taxable_amount')}</span>
                <span className="font-bold text-gray-600">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-wider">{t('gst')} (5%)</span>
                <span className="font-bold text-gray-600">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-gray-50 mb-4">
                <span className="text-gray-400 font-bold uppercase text-xs">{t('grand_total')}</span>
                <span className="text-3xl font-black text-primary">₹{totalAmount.toFixed(2)}</span>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutStatus === 'loading'}
                className={`w-full py-4 rounded-2xl font-black text-white text-lg transition-all flex items-center justify-center gap-2 ${
                  checkoutStatus === 'success' 
                    ? 'bg-green-500' 
                    : checkoutStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-primary hover:bg-primary-dark shadow-xl shadow-primary/30 active:scale-95'
                }`}
              >
                {checkoutStatus === 'loading' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                ) : checkoutStatus === 'success' ? (
                  <><CheckCircle2 /> {t('success')}</>
                ) : checkoutStatus === 'error' ? (
                  'Error!'
                ) : (
                  t('checkout')
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
