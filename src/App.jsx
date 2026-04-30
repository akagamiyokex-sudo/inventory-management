import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Sales from './pages/Sales';
import ProductManagement from './pages/ProductManagement';
import Dashboard from './pages/Dashboard';
import VendorMonitor from './pages/VendorMonitor';
import VendorRetailer from './pages/VendorRetailer';
import StaffManagement from './pages/StaffManagement';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname.toLowerCase().includes('/login');

  return (
    <div className={`min-h-screen bg-gray-50 ${!isLoginPage ? 'pb-16 md:pb-0' : ''}`}>
      {!isLoginPage && <Navbar />}
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/sales" element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          } />
          
          <Route path="/products" element={
            <ProtectedRoute adminOnly={true}>
              <ProductManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute adminOnly={true}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/monitor" element={
            <ProtectedRoute adminOnly={true}>
              <VendorMonitor />
            </ProtectedRoute>
          } />
          
          <Route path="/vendors" element={
            <ProtectedRoute adminOnly={true}>
              <VendorRetailer />
            </ProtectedRoute>
          } />
          
          <Route path="/staff" element={
            <ProtectedRoute adminOnly={true}>
              <StaffManagement />
            </ProtectedRoute>
          } />

          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/sales" replace />} />
          <Route path="*" element={<Navigate to="/sales" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

