import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  
  const { login } = useAuth();
  const { t, toggleLanguage, lang } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Map @ shortcuts to full emails
    let finalEmail = email;
    if (email.toLowerCase() === '@admin') {
      finalEmail = 'admin@selva.com';
    } else if (email.toLowerCase() === '@staff') {
      finalEmail = 'staff@selva.com';
    }

    try {
      await login(finalEmail, password);
      navigate('/sales');
    } catch (err) {
      console.error(err);
      setError('Invalid ID or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4">
            SV
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {lang === 'en' ? 'Welcome back! Please login to continue.' : 'வரவேற்கிறோம்! தொடர உள்நுழையவும்.'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 text-sm border border-red-100 animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Login ID</label>
              <input
                type="text"
                required
                className="block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="@admin or @staff"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} className="mr-2" />}
            {t('login')}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={toggleLanguage}
            className="w-full py-2 text-sm text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            Switch to {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>


        </div>
      </div>
    </div>
  );
};

export default Login;
