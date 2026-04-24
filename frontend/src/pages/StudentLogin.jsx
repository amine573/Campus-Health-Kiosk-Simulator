import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PharmacyLogo from '../assets/PharmacyLogo';
import api from '../utils/api';
import toast from 'react-hot-toast';

const StudentLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/portal';

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
        login(data.token, data.user);
        toast.success(`Welcome, ${data.user.name}!`);
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({ campusId: 'STU001', password: 'Student@12345' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
        <PharmacyLogo size={28} />
        <div>
          <span className="text-sm font-semibold text-brand-800">Campus Health Kiosk</span>
          <span className="ml-2 text-xs text-slate-500">Al Akhawayn University</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="card overflow-hidden">
            {/* Green header */}
            <div className="bg-brand-700 px-6 py-6 text-white text-center">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
                  <PharmacyLogo size={32} />
                </div>
              </div>
              <h1 className="text-lg font-semibold">Student & Staff Portal</h1>
              <p className="text-brand-200 text-xs mt-1">Sign in with your campus credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Campus ID */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Campus ID
                </label>
                <input
                  type="text"
                  value={form.campusId}
                  onChange={(e) => setForm((f) => ({ ...f, campusId: e.target.value }))}
                  placeholder="e.g. STU001"
                  className="input"
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password
                </label>
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <LogIn size={14} />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Campus Health Kiosk Simulator · Al Akhawayn University in Ifrane
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;