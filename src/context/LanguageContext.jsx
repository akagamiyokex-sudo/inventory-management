import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const translations = {
  en: {
    title: 'Selva Vegetable Mandi',
    login: 'Login',
    logout: 'Logout',
    sales: 'Sales',
    products: 'Products',
    dashboard: 'Dashboard',
    monitor: 'Staff Monitor',
    vendors: 'Vendors & Retailers',
    sellers: 'Sellers/Vendors',
    retailers: 'Retailers',
    shop_name: 'Shop Name',
    contact: 'Contact Info',
    address: 'Address',
    balance: 'Balance',
    total: 'Total',
    checkout: 'Checkout',
    quantity: 'Quantity',
    price: 'Price',
    stock: 'Stock',
    low_stock: 'Low Stock',
    add_to_cart: 'Add to Cart',
    cart: 'Shopping Cart',
    empty_cart: 'Cart is empty',
    save_sale: 'Save Sale',
    success: 'Sale recorded successfully',
    error: 'Error occurred',
    category: 'Category',
    en: 'English',
    ta: 'தமிழ்',
    history: 'Sale History',
    daily_revenue: 'Daily Revenue',
    top_products: 'Top Products',
    staff_mgmt: 'Staff Management',
    add_staff: 'Add Staff',
    staff_list: 'Staff List',
    staff_name: 'Staff Name',
    role: 'Role',
    phone: 'Phone Number',
    email: 'Email ID',
    actions: 'Actions',
    payment_method: 'Payment Method',
    cash: 'Cash',
    gpay: 'GPay',
    card: 'Card',
    print_bill: 'Print Bill',
    bill_no: 'Bill No',
    date: 'Date',
    thank_you: 'Thank you for your business!',
    items: 'Items',
    gst: 'GST',
    taxable_amount: 'Taxable Amount',
    gst_amount: 'GST Amount',
    grand_total: 'Grand Total',
  },
  ta: {
    title: 'செல்வா காய்கறி மண்டி',
    login: 'உள்நுழை',
    logout: 'வெளியேறு',
    sales: 'விற்பனை',
    products: 'பொருட்கள்',
    dashboard: 'டாஷ்போர்டு',
    monitor: 'பணியாளர் கண்காணிப்பு',
    vendors: 'விற்பனையாளர்கள் & சில்லறை விற்பனையாளர்கள்',
    sellers: 'விற்பனையாளர்கள்/சுய உற்பத்தியாளர்கள்',
    retailers: 'சில்லறை விற்பனையாளர்கள்',
    shop_name: 'கடை பெயர்',
    contact: 'தொடர்பு எண்',
    address: 'விலாசம்',
    balance: 'மீதமுள்ள தொகை',
    total: 'மொத்தம்',
    checkout: 'செக் அவுட்',
    quantity: 'அளவு',
    price: 'விலை',
    stock: 'இருப்பு',
    low_stock: 'குறைந்த இருப்பு',
    add_to_cart: 'கார்ட்டில் சேர்',
    cart: 'கூடை',
    empty_cart: 'கூடை காலியாக உள்ளது',
    save_sale: 'விற்பனையை சேமி',
    success: 'விற்பனை வெற்றிகரமாக பதிவு செய்யப்பட்டது',
    error: 'பிழை ஏற்பட்டது',
    category: 'வகை',
    en: 'English',
    ta: 'தமிழ்',
    history: 'விற்பனை வரலாறு',
    daily_revenue: 'தினசரி வருவாய்',
    top_products: 'சிறந்த பொருட்கள்',
    staff_mgmt: 'பணியாளர் மேலாண்மை',
    add_staff: 'பணியாளரைச் சேர்க்கவும்',
    staff_list: 'பணியாளர் பட்டியல்',
    staff_name: 'பணியாளர் பெயர்',
    role: 'பதவி',
    phone: 'தொலைபேசி எண்',
    email: 'மின்னஞ்சல்',
    actions: 'செயல்கள்',
    payment_method: 'பணம் செலுத்தும் முறை',
    cash: 'பணம்',
    gpay: 'GPay',
    card: 'கார்டு',
    print_bill: 'பில் அச்சிடு',
    bill_no: 'பில் எண்',
    date: 'தேதி',
    thank_you: 'மிக்க நன்றி, மீண்டும் வருக!',
    items: 'பொருட்கள்',
    gst: 'ஜிஎஸ்டி (GST)',
    taxable_amount: 'வரிக்குட்பட்ட தொகை',
    gst_amount: 'ஜிஎஸ்டி தொகை',
    grand_total: 'மொத்தத் தொகை',
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ta' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
