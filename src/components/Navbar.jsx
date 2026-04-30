import React from 'react';
import { LogOut, Globe, ShoppingCart, LayoutDashboard, Package, Users, Store, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isLoginPage = location.pathname.toLowerCase().includes('/login');
  if (!user || isLoginPage) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
              <span className="bg-primary text-white p-1.5 rounded-lg">SV</span>
              <span className="hidden sm:inline">{t('title')}</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-4 ml-8">
              <Link to="/sales" className="text-gray-600 hover:text-primary flex items-center gap-1 font-medium px-3 py-2 rounded-md">
                <ShoppingCart size={18} /> {t('sales')}
              </Link>
              
              {role === 'admin' && (
                <>
                  <Link to="/products" className="text-gray-600 hover:text-primary flex items-center gap-1 font-medium px-3 py-2 rounded-md">
                    <Package size={18} /> {t('products')}
                  </Link>
                  <Link to="/dashboard" className="text-gray-600 hover:text-primary flex items-center gap-1 font-medium px-3 py-2 rounded-md">
                    <LayoutDashboard size={18} /> {t('dashboard')}
                  </Link>
                  <Link to="/monitor" className="text-gray-600 hover:text-primary flex items-center gap-1 font-medium px-3 py-2 rounded-md">
                    <Users size={18} /> {t('monitor')}
                  </Link>
                  <Link to="/staff" className="text-gray-600 hover:text-primary flex items-center gap-1 font-medium px-3 py-2 rounded-md">
                    <UserPlus size={18} /> {t('add_staff')}
                  </Link>
                  <Link to="/vendors" className="text-gray-600 hover:text-primary flex items-center gap-1 font-medium px-3 py-2 rounded-md">
                    <Store size={18} /> {t('vendors')}
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Globe size={16} />
              {lang === 'en' ? 'தமிழ்' : 'English'}
            </button>
            
            <div className="flex items-center gap-2 ml-2 sm:ml-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500 uppercase font-bold">{role}</p>
                <p className="text-sm font-medium">{user.email?.split('@')[0]}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-accent transition-colors rounded-full hover:bg-red-50"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu - Bottom Bar for easier access */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 px-2 shadow-lg">
        <Link to="/sales" className="flex flex-col items-center gap-1 text-gray-500 active:text-primary">
          <ShoppingCart size={24} />
          <span className="text-[10px] font-bold">{t('sales')}</span>
        </Link>
        {role === 'admin' && (
          <>
            <Link to="/products" className="flex flex-col items-center gap-1 text-gray-500 active:text-primary">
              <Package size={24} />
              <span className="text-[10px] font-bold">{t('products')}</span>
            </Link>
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-500 active:text-primary">
              <LayoutDashboard size={24} />
              <span className="text-[10px] font-bold">{t('dashboard')}</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
