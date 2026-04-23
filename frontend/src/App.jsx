import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import StudentLogin  from './pages/StudentLogin';
import AdminLogin    from './pages/AdminLogin';
import StudentPortal from './pages/StudentPortal';
import MyTokens      from './pages/MyTokens';
import KioskInterface from './pages/KioskInterface';
import AdminDashboard from './pages/AdminDashboard';

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <p className="text-6xl font-bold text-brand-700 mb-3">403</p>
      <p className="text-slate-700 font-semibold mb-1">Access Denied</p>
      <p className="text-sm text-slate-500 mb-4">You don't have permission to view this page.</p>
      <a href="/login" className="btn-primary inline-block">Return to Login</a>
    </div>
  </div>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '8px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' },
          success: { iconTheme: { primary: '#166534', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login"        element={<StudentLogin />} />
        <Route path="/admin/login"  element={<AdminLogin />} />
        <Route path="/kiosk"        element={<KioskInterface />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Student / Staff */}
        <Route path="/portal" element={<ProtectedRoute><StudentPortal /></ProtectedRoute>} />
        <Route path="/portal/tokens" element={<ProtectedRoute><MyTokens /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="Administrator"><AdminDashboard /></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
