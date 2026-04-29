import React from 'react';
import { Plus, Minus, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ProductCard = ({ product, addToCart, decrementFromCart, cartQuantity }) => {
  const { lang, t } = useLanguage();

  const isLowStock = product.stock > 0 && product.stock <= 10;
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      onClick={() => !isOutOfStock && addToCart(product)}
      className={`relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] border-2 ${cartQuantity > 0 ? 'border-primary' : 'border-transparent'}`}
    >
      <div className="aspect-square w-full relative group">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400'}
          alt={product.name_en}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400';
            e.target.onerror = null;
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-2 sm:p-4">
            <span className="bg-red-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-bold uppercase tracking-widest">
              {lang === 'en' ? 'Out of Stock' : 'ஸ்டாக் இல்லை'}
            </span>
          </div>
        )}
      </div>

      <div className="p-2 sm:p-4">
        <div className="flex justify-between items-start mb-0.5 sm:mb-1">
          <h3 className="font-bold text-sm sm:text-lg leading-tight line-clamp-2">
            {lang === 'en' ? product.name_en : product.name_ta}
          </h3>
          <span className="text-primary font-black text-base sm:text-xl ml-1">₹{product.price}</span>
        </div>

        <div className="flex justify-between items-center mt-1 sm:mt-3">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-tighter">
              {t('stock')}: <span className={isLowStock ? 'text-accent' : 'text-gray-600'}>{product.stock}</span>
            </span>
            {isLowStock && (
              <span className="text-[8px] sm:text-[10px] text-accent font-bold animate-pulse uppercase">
                {t('low_stock')}!
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {cartQuantity > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decrementFromCart(product.id);
                }}
                className="farmer-touch p-1.5 sm:p-2 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Minus size={16} className="sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                !isOutOfStock && addToCart(product);
              }}
              disabled={isOutOfStock}
              className={`farmer-touch p-1.5 sm:p-2 rounded-lg flex items-center justify-center ${isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/20'
                }`}
            >
              <Plus size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {cartQuantity > 0 && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-primary text-white h-5 w-5 sm:h-7 sm:w-7 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm shadow-md animate-in zoom-in">
          {cartQuantity}
        </div>
      )}
    </div>
  );
};

export default ProductCard;
