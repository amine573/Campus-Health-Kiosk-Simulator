import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PharmacyLogo from '../assets/PharmacyLogo';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Microsoft SSO simulation (replace with real MSAL in production)
const simulateMicrosoftLogin = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        microsoftId: 'ms_' + Math.random().toString(36).slice(2),
        email: `student${Math.floor(Math.random() * 9000 + 1000)}@aui.ma`,
        name: 'Demo Student',
        campusId: 'S' + Math.floor(Math.random() * 90000 + 10000),
      });
    }, 1200);
  });

const StudentLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/portal';

  const [msLoading, setMsLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    setMsLoading(true);
    try {
      const msData = await simulateMicrosoftLogin();
      const { data } = await api.post('/auth/microsoft', msData);
      if (data.success) {
        login(data.token, data.user);
        toast.success(`Welcome, ${data.user.name}!`);
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Microsoft login failed');
    } finally {
      setMsLoading(false);
    }
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

          {/* Card */}
          <div className="card overflow-hidden">
            {/* Green header band */}
            <div className="bg-brand-700 px-6 py-6 text-white text-center">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
                  <PharmacyLogo size={32} />
                </div>
              </div>
              <h1 className="text-lg font-semibold">Student & Staff Portal</h1>
              <p className="text-brand-200 text-xs mt-1">Sign in with your university account</p>
            </div>

            <div className="p-6">
              {/* Security notice */}
              <div className="flex gap-2.5 p-3 bg-brand-50 border border-brand-200 rounded-lg mb-6">
                <Shield size={14} className="text-brand-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-800 leading-relaxed">
                  Access is restricted to authenticated campus members. Sign in with your Al Akhawayn Microsoft account.
                </p>
              </div>

              {/* Microsoft SSO button */}
              <button
                onClick={handleMicrosoftLogin}
                disabled={msLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0078d4] hover:bg-[#106ebe] active:bg-[#005a9e] text-white rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {msLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                )}
                {msLoading ? 'Signing in…' : 'Sign in with Microsoft'}
              </button>

              <div className="flex items-center gap-3 my-4">
                <hr className="flex-1 border-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <hr className="flex-1 border-slate-200" />
              </div>

              {/* Admin link */}
              <p className="text-center text-xs text-slate-500">
                Administrator?{' '}
                <a href="/admin/login" className="text-brand-700 font-medium hover:underline">
                  Sign in here
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-4">
            Campus Health Kiosk Simulator · Al Akhawayn University in Ifrane
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
