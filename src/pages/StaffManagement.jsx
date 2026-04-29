import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Phone, Shield, Trash2, Loader2, AlertCircle, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { getUsers, createStaffUser, deleteUser } from '../firebase/db';
import { useLanguage } from '../context/LanguageContext';

const StaffManagement = () => {
  const { t } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    password: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setStaff(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load staff list: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setAdding(false);
      return;
    }

    try {
      await createStaffUser(formData);
      setSuccess(`Staff account for "${formData.name}" created successfully! They can now log in with their email and password.`);
      setFormData({ name: '', email: '', phone: '', role: 'staff', password: '' });
      await fetchStaff();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format. Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError('Failed to add staff member: ' + err.message);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from staff records? (This only removes the Firestore profile, not their login.)`)) return;
    setDeletingId(id);
    try {
      await deleteUser(id);
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
          <Users size={32} /> {t('staff_mgmt')}
        </h1>
        <p className="text-gray-500 mt-1">Add staff accounts and manage your team. New staff can log in immediately after being added.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Staff Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl sticky top-24">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <UserPlus size={24} className="text-primary" />
              {t('add_staff')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-2xl text-sm flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{t('staff_name')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Users size={16} /></span>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="Staff Full Name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{t('email')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={16} /></span>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="staff@selva.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{t('phone')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={16} /></span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{t('role')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Shield size={16} /></span>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm appearance-none"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Login Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Staff will use this password to log in to the dashboard.</p>
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {adding ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                {adding ? 'Creating Account...' : t('add_staff')}
              </button>
            </form>
          </div>
        </div>

        {/* Staff List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-black">{t('staff_list')}</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold uppercase">
                {staff.length} members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('staff_name')}</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('email')}</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('role')}</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-xl"></div><div className="h-4 bg-gray-100 rounded w-24"></div></div></td>
                        <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-36"></div></td>
                        <td className="px-6 py-5"><div className="h-6 bg-gray-100 rounded-full w-16"></div></td>
                        <td className="px-6 py-5"><div className="h-8 w-8 bg-gray-100 rounded-lg"></div></td>
                      </tr>
                    ))
                  ) : staff.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center">
                        <Users size={40} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-gray-400 font-bold">No staff members yet.</p>
                        <p className="text-gray-300 text-sm">Use the form to add your first team member.</p>
                      </td>
                    </tr>
                  ) : (
                    staff.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black uppercase text-lg">
                              {member.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-400">{member.phone || 'No phone'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            member.role === 'admin'
                              ? 'bg-red-50 text-red-500'
                              : 'bg-green-50 text-green-600'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDelete(member.id, member.name)}
                            disabled={deletingId === member.id}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors border border-gray-100 rounded-lg hover:bg-red-50 hover:border-red-100 disabled:opacity-50"
                            title="Remove from staff list"
                          >
                            {deletingId === member.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Trash2 size={16} />
                            }
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
