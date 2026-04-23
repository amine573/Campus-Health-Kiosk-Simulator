import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PharmacyLogo from '../assets/PharmacyLogo';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [form, setForm] = useState({ campusId: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.campusId || !form.password) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.success) {
        if (data.user.role !== 'Administrator') {
          toast.error('Admin access only');
          return;
        }
        login(data.token, data.user);
        toast.success('Welcome back, Administrator!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-brand-900 border-b border-brand-800 px-6 py-3 flex items-center gap-3">
        <PharmacyLogo size={26} />
        <span className="text-sm font-semibold text-white">Campus Health Kiosk</span>
        <span className="ml-auto text-xs text-brand-300">Administration</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="card overflow-hidden">
            <div className="bg-brand-900 px-6 py-6 text-white text-center">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={28} className="text-brand-300" />
                </div>
              </div>
              <h1 className="text-lg font-semibold">Administrator Login</h1>
              <p className="text-brand-300 text-xs mt-1">Restricted access — authorized personnel only</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Campus ID</label>
                <input
                  type="text"
                  value={form.campusId}
                  onChange={(e) => setForm((f) => ({ ...f, campusId: e.target.value }))}
                  placeholder="e.g. ADMIN001"
                  className="input"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="input pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={14} />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <p className="text-center text-xs text-slate-500 pt-1">
                Student?{' '}
                <a href="/login" className="text-brand-700 font-medium hover:underline">Student portal login</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
