import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PharmacyLogo from '../assets/PharmacyLogo';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ── Microsoft logo SVG ────────────────────────────────────────────────────────
const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
    <rect x="1"  y="1"  width="9" height="9" fill="#f25022" />
    <rect x="11" y="1"  width="9" height="9" fill="#7fba00" />
    <rect x="1"  y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

// ── Pharmacy-themed SVG illustration (right panel) ────────────────────────────
const PharmaIllustration = () => (
  <svg viewBox="0 0 520 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-[480px]">
    {/* Background blobs */}
    <ellipse cx="380" cy="120" rx="160" ry="140" fill="#14532d" opacity="0.45" />
    <ellipse cx="140" cy="360" rx="140" ry="120" fill="#14532d" opacity="0.35" />
    <ellipse cx="460" cy="380" rx="100" ry="100" fill="#166534" opacity="0.3" />

    {/* Large decorative cross — centre */}
    <rect x="210" y="100" width="80" height="260" rx="16" fill="#16a34a" opacity="0.9" />
    <rect x="120" y="190" width="260" height="80" rx="16" fill="#16a34a" opacity="0.9" />
    {/* Highlight */}
    <rect x="228" y="118" width="44" height="224" rx="8" fill="#4ade80" opacity="0.25" />
    <rect x="138" y="208" width="224" height="44" rx="8" fill="#4ade80" opacity="0.25" />

    {/* Pill — top right */}
    <g transform="rotate(-40 400 140)">
      <rect x="360" y="110" width="80" height="36" rx="18" fill="#bbf7d0" opacity="0.85" />
      <rect x="360" y="110" width="40" height="36" rx="18" fill="#86efac" opacity="0.7" />
      <line x1="400" y1="112" x2="400" y2="144" stroke="#4ade80" strokeWidth="1.5" opacity="0.5" />
    </g>

    {/* Pill — bottom left */}
    <g transform="rotate(20 110 370)">
      <rect x="70" y="352" width="80" height="36" rx="18" fill="#bbf7d0" opacity="0.7" />
      <rect x="70" y="352" width="40" height="36" rx="18" fill="#86efac" opacity="0.5" />
      <line x1="110" y1="354" x2="110" y2="386" stroke="#4ade80" strokeWidth="1.5" opacity="0.4" />
    </g>

    {/* Small capsule — top left */}
    <g transform="rotate(-15 80 130)">
      <rect x="50" y="118" width="56" height="24" rx="12" fill="#4ade80" opacity="0.55" />
      <rect x="50" y="118" width="28" height="24" rx="12" fill="#86efac" opacity="0.4" />
    </g>

    {/* Floating dots */}
    <circle cx="320" cy="80"  r="8"  fill="#4ade80" opacity="0.5" />
    <circle cx="170" cy="90"  r="5"  fill="#86efac" opacity="0.4" />
    <circle cx="450" cy="260" r="10" fill="#4ade80" opacity="0.35" />
    <circle cx="90"  cy="260" r="7"  fill="#bbf7d0" opacity="0.4" />
    <circle cx="410" cy="420" r="6"  fill="#4ade80" opacity="0.5" />
    <circle cx="200" cy="430" r="9"  fill="#86efac" opacity="0.3" />

    {/* Small cross — top left accent */}
    <rect x="60"  y="170" width="10" height="30" rx="3" fill="#4ade80" opacity="0.5" />
    <rect x="50"  y="180" width="30" height="10" rx="3" fill="#4ade80" opacity="0.5" />

    {/* Small cross — bottom right accent */}
    <rect x="430" y="330" width="10" height="30" rx="3" fill="#4ade80" opacity="0.4" />
    <rect x="420" y="340" width="30" height="10" rx="3" fill="#4ade80" opacity="0.4" />

    {/* Kiosk silhouette */}
    <rect x="218" y="340" width="64" height="90" rx="6" fill="#052e16" opacity="0.55" />
    <rect x="226" y="348" width="48" height="56" rx="4" fill="#166534" opacity="0.7" />
    {/* Screen glow */}
    <rect x="230" y="352" width="40" height="48" rx="2" fill="#4ade80" opacity="0.15" />
    {/* QR pattern hint */}
    <rect x="234" y="356" width="8" height="8" rx="1" fill="#4ade80" opacity="0.5" />
    <rect x="246" y="356" width="8" height="8" rx="1" fill="#4ade80" opacity="0.5" />
    <rect x="258" y="356" width="8" height="8" rx="1" fill="#4ade80" opacity="0.5" />
    <rect x="234" y="368" width="8" height="8" rx="1" fill="#4ade80" opacity="0.5" />
    <rect x="258" y="368" width="8" height="8" rx="1" fill="#4ade80" opacity="0.5" />
    <rect x="234" y="380" width="8" height="8" rx="1" fill="#4ade80" opacity="0.5" />
    <rect x="246" y="380" width="8" height="8" rx="1" fill="#4ade80" opacity="0.5" />
    <rect x="258" y="380" width="8" height="8" rx="1" fill="#4ade80" opacity="0.5" />
    {/* Base */}
    <rect x="206" y="428" width="88" height="12" rx="4" fill="#052e16" opacity="0.45" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

const StudentLogin = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = location.state?.from?.pathname || '/portal';

  const [form, setForm]         = useState({ campusId: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

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

  const fillDemo = () => setForm({ campusId: 'STU001', password: 'Student@12345' });

  const handleMicrosoft = () => {
    toast('Microsoft SSO coming soon', { icon: '🔜' });
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — form ─────────────────────────────────────────────── */}
      <div className="w-full md:w-[440px] lg:w-[480px] flex-shrink-0 flex flex-col bg-white px-10 py-10 overflow-y-auto">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12">
          <PharmacyLogo size={36} />
          <div>
            <p className="text-sm font-bold text-brand-900 leading-tight">Campus Health Kiosk</p>
            <p className="text-[11px] text-slate-400 leading-tight">Al Akhawayn University</p>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-1">
            Log in to your account
          </h1>
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <span className="text-brand-700 font-semibold cursor-default">
              Contact your administrator
            </span>
          </p>
        </div>

        {/* Microsoft SSO button */}
        <button
          type="button"
          onClick={handleMicrosoft}
          className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors mb-6"
        >
          <MicrosoftIcon />
          Sign in with Microsoft
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 whitespace-nowrap">Or with campus ID and password</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Campus ID
            </label>
            <input
              type="text"
              value={form.campusId}
              onChange={e => setForm(f => ({ ...f, campusId: e.target.value }))}
              placeholder="e.g. STU001 or amine"
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition pr-10"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <LogIn size={15} />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

        </form>

        <p className="text-[11px] text-slate-400 mt-8 text-center">
          © {new Date().getFullYear()} Campus Health Kiosk · Al Akhawayn University in Ifrane
        </p>
      </div>

      {/* ── Right panel — illustration ────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #14532d 40%, #166534 70%, #15803d 100%)' }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Noise grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Main content */}
        <div className="relative z-10 px-12 py-10 max-w-lg w-full">
          <PharmaIllustration />

          <div className="mt-8 text-center">
            <h2 className="text-white text-2xl font-bold leading-snug mb-3">
              Your campus health,<br />at your fingertips
            </h2>
            <p className="text-green-300 text-sm leading-relaxed max-w-sm mx-auto">
              Request health products, scan your QR code at the kiosk, and collect your item — all in under a minute.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentLogin;