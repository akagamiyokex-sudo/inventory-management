import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, CreditCard, Calendar } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { useLanguage } from '../context/LanguageContext';

const VendorMonitor = () => {
  const [staffStats, setStaffStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useLanguage();

  useEffect(() => {
    fetchStaffPerformance();
  }, []);

  const fetchStaffPerformance = async () => {
    setLoading(true);
    try {
      // 1. Fetch all sales
      const salesSnapshot = await getDocs(collection(db, "sales"));
      const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Group by staff_id
      const stats = sales.reduce((acc, sale) => {
        const staffId = sale.staff_id || 'Unknown';
        if (!acc[staffId]) {
          acc[staffId] = {
            id: staffId,
            totalSales: 0,
            transactions: 0,
            lastSale: null
          };
        }
        acc[staffId].totalSales += sale.total_amount;
        acc[staffId].transactions += 1;
        
        const saleDate = sale.date?.toDate();
        if (!acc[staffId].lastSale || (saleDate && saleDate > acc[staffId].lastSale)) {
          acc[staffId].lastSale = saleDate;
        }
        
        return acc;
      }, {});

      setStaffStats(Object.values(stats).sort((a, b) => b.totalSales - a.totalSales));
    } catch (error) {
      console.error("Staff monitor fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
          <Users size={32} /> {t('monitor')}
        </h1>
        <p className="text-gray-500">Track performance of your staff and vendors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-100 rounded"></div>
                <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))
        ) : staffStats.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-bold">No sales data found for any staff.</p>
          </div>
        ) : (
          staffStats.map((staff, i) => (
            <div key={staff.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              {/* Rank Badge */}
              <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-2xl font-black text-sm">
                #{i + 1}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-primary">
                  <span className="text-2xl font-black uppercase">{staff.id.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 truncate max-w-[150px]">
                    {staff.id === 'Unknown' ? 'Unknown Staff' : staff.id.split('@')[0]}
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{staff.id === 'Unknown' ? 'N/A' : 'Staff Member'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-2xl">
                  <div className="flex items-center gap-2 text-primary">
                    <CreditCard size={18} />
                    <span className="text-xs font-bold uppercase">Total Revenue</span>
                  </div>
                  <span className="font-black text-primary">₹{staff.totalSales.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-2xl">
                  <div className="flex items-center gap-2 text-secondary">
                    <ShoppingBag size={18} />
                    <span className="text-xs font-bold uppercase">Transactions</span>
                  </div>
                  <span className="font-black text-secondary">{staff.transactions}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={18} />
                    <span className="text-xs font-bold uppercase">Last Sale</span>
                  </div>
                  <span className="text-xs font-bold text-gray-700">
                    {staff.lastSale ? staff.lastSale.toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorMonitor;
