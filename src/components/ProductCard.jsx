import React from 'react';
import { Plus, Minus, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ProductCard = ({ product, addToCart, cartQuantity }) => {
  const { lang, t } = useLanguage();

  const isLowStock = product.stock > 0 && product.stock <= 10;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-2 ${cartQuantity > 0 ? 'border-primary' : 'border-transparent'}`}>
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
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-4">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-widest">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg leading-tight">
            {lang === 'en' ? product.name_en : product.name_ta}
          </h3>
          <span className="text-primary font-black text-xl">₹{product.price}</span>
        </div>

        <div className="flex justify-between items-center mt-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-tighter">
              {t('stock')}: <span className={isLowStock ? 'text-accent' : 'text-gray-600'}>{product.stock}</span>
            </span>
            {isLowStock && (
              <span className="text-[10px] text-accent font-bold animate-pulse uppercase">
                {t('low_stock')}!
              </span>
            )}
          </div>

          <button
            onClick={() => !isOutOfStock && addToCart(product)}
            disabled={isOutOfStock}
            className={`farmer-touch p-3 rounded-xl flex items-center justify-center ${isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'
              }`}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {cartQuantity > 0 && (
        <div className="absolute top-2 right-2 bg-primary text-white h-7 w-7 rounded-full flex items-center justify-center font-bold text-sm shadow-md animate-in zoom-in">
          {cartQuantity}
        </div>
      )}
    </div>
  );
};

export default ProductCard;
