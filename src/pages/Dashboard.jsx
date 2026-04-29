import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    uniqueProducts: 0,
    avgSaleValue: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Sales
      const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"), limit(100));
      const salesSnapshot = await getDocs(salesQuery);
      const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Fetch Products Count
      const productsSnapshot = await getDocs(collection(db, "products"));
      
      // 3. Process Stats
      const revenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
      setStats({
        totalRevenue: revenue,
        totalSales: sales.length,
        uniqueProducts: productsSnapshot.size,
        avgSaleValue: sales.length > 0 ? (revenue / sales.length).toFixed(2) : 0
      });

      // 4. Group for Chart (by day)
      const groupedByDay = sales.reduce((acc, sale) => {
        if (!sale.date) return acc;
        const date = sale.date.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + sale.total_amount;
        return acc;
      }, {});

      const chartData = Object.keys(groupedByDay).map(date => ({
        date,
        revenue: groupedByDay[date]
      })).reverse().slice(-7);

      setSalesData(chartData);

      // 5. Top Products logic
      const productCounts = {};
      sales.forEach(sale => {
        sale.products?.forEach(p => {
          productCounts[p.name] = (productCounts[p.name] || 0) + p.quantity;
        });
      });

      const top = Object.keys(productCounts)
        .map(name => ({ name, count: productCounts[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopProducts(top);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-500">Overview of your business performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="text-primary" />} 
          trend="+12%" 
          color="bg-green-50"
        />
        <StatCard 
          title="Sales Count" 
          value={stats.totalSales} 
          icon={<ShoppingCart className="text-secondary" />} 
          trend="+5%" 
          color="bg-yellow-50"
        />
        <StatCard 
          title="Avg. Sale" 
          value={`₹${stats.avgSaleValue}`} 
          icon={<TrendingUp className="text-blue-500" />} 
          trend="-2%" 
          color="bg-blue-50"
        />
        <StatCard 
          title="Total Products" 
          value={stats.uniqueProducts} 
          icon={<Package className="text-purple-500" />} 
          trend="0%" 
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <CalendarIcon size={20} /> Latest Revenue
            </h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last 7 Days</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="revenue" fill="#16a34a" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} /> {t('top_products')}
          </h3>
          <div className="space-y-6">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white ${COLORS[i % COLORS.length]}`}>
                    {i + 1}
                  </div>
                  <span className="font-bold text-gray-700">{p.name}</span>
                </div>
                <span className="text-sm font-black bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                  {p.count} qty
                </span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-center text-gray-400 py-12 italic">No sales data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color }) => (
  <div className={`p-6 rounded-3xl border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color}`}>
        {icon}
      </div>
      <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {trend} {trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      </div>
    </div>
    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">{title}</span>
    <h4 className="text-2xl font-black text-gray-900 mt-1">{value}</h4>
  </div>
);

export default Dashboard;
