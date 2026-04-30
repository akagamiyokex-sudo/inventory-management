import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Package, Search, Image as ImageIcon, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createProduct, updateProduct, deleteProduct, subscribeProducts } from '../firebase/db';
import { useLanguage } from '../context/LanguageContext';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ta: '',
    price: '',
    stock: '',
    category: 5,
    priority: 10,
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const CATEGORIES = {
    5: { label: 'Vegetable', color: 'bg-green-100 text-green-700' },
    6: { label: 'Mushroom',  color: 'bg-yellow-100 text-yellow-700' },
    7: { label: 'Dairy',     color: 'bg-blue-100 text-blue-700' },
    8: { label: 'Groceries', color: 'bg-orange-100 text-orange-700' },
  };

  const { t, lang } = useLanguage();

  useEffect(() => {
    const unsubscribe = subscribeProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product });
    } else {
      setEditingProduct(null);
      setFormData({
        name_en: '',
        name_ta: '',
        price: '',
        stock: '',
        category: 5,
        priority: products.length + 1,
        image_url: ''
      });
    }
    setImageFile(null);
    setImagePreview(product?.image_url || '');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear image file if user starts typing a URL
    if (name === 'image_url' && value !== '') {
      setImageFile(null);
      setImagePreview('');
    }

    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'price' || name === 'stock' || name === 'category' || name === 'priority') ? (value === '' ? '' : value) : value 
    }));
  };


  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; // Smaller for even faster uploads
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            // Return the blob and original file name to avoid File constructor issues on some browsers
            resolve({ blob, name: file.name, size: blob.size });
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleFileChange = async (e) => {
    if (e.target.files[0]) {
      const originalFile = e.target.files[0];
      setIsCompressing(true);
      
      // Create temporary preview of the original for immediate feedback
      const tempPreview = URL.createObjectURL(originalFile);
      setImagePreview(tempPreview);

      try {
        const compressedData = await compressImage(originalFile);
        setImageFile(compressedData); // Store the object {blob, name, size}
        
        // Replace temp preview with compressed version
        const finalPreview = URL.createObjectURL(compressedData.blob);
        setImagePreview(finalPreview);
      } catch (err) {
        console.error("Compression failed:", err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        // imageFile is now an object: { blob, name, size }
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile.blob);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      const productData = { 
        ...formData, 
        image_url: finalImageUrl,
        // Ensure numbers are converted before sending to DB
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        category: parseInt(formData.category) || 5,
        priority: parseInt(formData.priority) || 0
      };

      console.log("Saving product data:", productData);

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        showFeedback('success', 'Product updated successfully!');
      } else {
        await createProduct(productData);
        showFeedback('success', 'Product added successfully!');
      }

      setIsModalOpen(false);
      // fetchProducts() is no longer needed due to subscribeProducts
    } catch (error) {
      console.error("Error saving product:", error);
      showFeedback('error', "Error saving product: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        showFeedback('success', 'Product deleted!');
        // fetchProducts() is no longer needed
      } catch (error) {
        console.error("Error deleting product:", error);
        showFeedback('error', 'Failed to delete product');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.name_ta.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-20 right-4 z-[100] flex items-center gap-2 px-6 py-3 rounded-2xl shadow-2xl animate-bounce ${
          feedback.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
          <span className="font-bold">{feedback.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <Package size={32} /> {t('products')}
          </h1>
          <p className="text-gray-500">Manage your inventory, prices and stock levels.</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus size={20} /> Add New Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && products.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-12 h-12 bg-gray-200 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-20 bg-gray-200 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <img 
                        src={product.image_url || 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400'} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100" 
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400';
                          e.target.onerror = null;
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{product.name_en}</p>
                      <p className="text-xs text-gray-500">{product.name_ta}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">₹{product.price}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${CATEGORIES[product.category]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {CATEGORIES[product.category]?.label || `Cat. ${product.category}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-white rounded-lg shadow-sm"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
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
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Package size={24} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Name (English)</label>
                  <input
                    type="text"
                    name="name_en"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="e.g. Onion"
                    value={formData.name_en}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Name (Tamil)</label>
                  <input
                    type="text"
                    name="name_ta"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="e.g. வெங்காயம்"
                    value={formData.name_ta}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Initial Stock</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value={5}>Vegetable</option>
                    <option value={6}>Mushroom</option>
                    <option value={7}>Dairy</option>
                    <option value={8}>Groceries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Priority Order</label>
                  <input
                    type="number"
                    name="priority"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={formData.priority}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Image</label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative group mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-2xl hover:border-primary transition-all bg-gray-50/50">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-primary transition-colors" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-bold text-primary hover:text-primary-dark transition-colors">
                            <span>{imageFile ? 'Change File' : 'Upload a file'}</span>
                            <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-400">Compressed to JPEG for speed</p>
                        {imageFile && (
                          <p className="text-[10px] text-green-600 font-bold mt-2">
                            Ready: {(imageFile.size / 1024).toFixed(1)}KB
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Or paste Image URL</label>
                      <input
                        type="text"
                        name="image_url"
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image_url}
                        onChange={handleInputChange}
                      />
                    </div>
                    {(imagePreview || formData.image_url) && (
                      <div className="mt-4 p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden relative">
                          {isCompressing && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                              <Loader2 size={16} className="animate-spin text-white" />
                            </div>
                          )}
                          <img 
                            src={imagePreview || formData.image_url || 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400'} 
                            alt="Preview" 
                            className={`w-full h-full object-cover transition-opacity ${isCompressing ? 'opacity-50' : 'opacity-100'}`}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1506484334406-f11215238df2?auto=format&fit=crop&q=80&w=400';
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            {isCompressing ? 'Compressing...' : 'Preview Ready'}
                          </span>
                          <span className="text-[9px] text-gray-400 italic">
                            {imageFile ? `${(imageFile.size / 1024).toFixed(1)}KB optimized` : 'Using URL source'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isCompressing}
                  className={`px-10 py-3 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-lg ${
                    (isSaving || isCompressing) ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark shadow-primary/20 active:scale-95'
                  }`}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {isSaving ? 'Saving...' : isCompressing ? 'Compressing...' : (editingProduct ? 'Update Product' : 'Save Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
