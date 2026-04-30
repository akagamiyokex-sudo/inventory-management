import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Store, 
  Truck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Phone, 
  MapPin, 
  Wallet 
} from 'lucide-react';
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { useLanguage } from '../context/LanguageContext';

const VendorRetailer = () => {
  const [activeTab, setActiveTab] = useState('sellers'); // 'sellers' or 'retailers'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    shop_name: '',
    balance: 0,
    category: ''
  });

  const { t, lang } = useLanguage();

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, activeTab), orderBy("name", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        phone: '',
        address: '',
        shop_name: '',
        balance: 0,
        category: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'balance' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, activeTab, editingItem.id), formData);
      } else {
        await addDoc(collection(db, activeTab), formData);
      }
      setIsModalOpen(false);
      // Real-time listener handles the state update
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(lang === 'en' ? "Are you sure?" : "நிச்சயமாக அழிக்க வேண்டுமா?")) {
      try {
        await deleteDoc(doc(db, activeTab, id));
        // Real-time listener handles the state update
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const filteredData = data.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone?.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <Users size={32} /> {t('vendors')}
          </h1>
          <p className="text-gray-500">Manage your business contacts and partners.</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus size={20} /> {lang === 'en' ? 'Add New' : 'புதிய பதிவு'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sellers')}
          className={`pb-4 px-4 text-sm font-black transition-all border-b-4 ${
            activeTab === 'sellers' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck size={18} /> {t('sellers')}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('retailers')}
          className={`pb-4 px-4 text-sm font-black transition-all border-b-4 ${
            activeTab === 'retailers' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Store size={18} /> {t('retailers')}
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={lang === 'en' ? "Search..." : "தேடுக..."}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">{lang === 'en' ? 'Name' : 'பெயர்'}</th>
              <th className="px-6 py-4">{t('contact')}</th>
              <th className="px-6 py-4">{t('address')}</th>
              {activeTab === 'retailers' && <th className="px-6 py-4">{t('balance')}</th>}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 rounded"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-8 w-20 bg-gray-200 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No records found.</td>
              </tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    {item.shop_name && <p className="text-xs text-gray-500">{item.shop_name}</p>}
                    {item.category && <p className="text-[10px] text-primary uppercase font-bold">{item.category}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" /> {item.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 truncate max-w-xs">
                      <MapPin size={14} className="text-gray-400" /> {item.address}
                    </div>
                  </td>
                  {activeTab === 'retailers' && (
                    <td className="px-6 py-4 font-black text-secondary">
                      ₹{item.balance || 0}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-white rounded-lg shadow-sm"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-accent transition-colors hover:bg-white rounded-lg shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900">
                {editingItem ? 'Edit Details' : 'Add New Entry'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                {activeTab === 'retailers' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('shop_name')}</label>
                    <input
                      type="text"
                      name="shop_name"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.shop_name}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
                {activeTab === 'sellers' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Category (e.g. Farmer)</label>
                    <input
                      type="text"
                      name="category"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.category}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
                {activeTab === 'retailers' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('balance')} (₹)</label>
                    <input
                      type="number"
                      name="balance"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.balance}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                <textarea
                  name="address"
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  value={formData.address}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-all flex items-center gap-2"
                >
                   <Save size={20} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRetailer;
