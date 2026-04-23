import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PharmacyLogo from '../../assets/PharmacyLogo';
import toast from 'react-hot-toast';

const roleBadgeClass = { Administrator: 'badge-red', Staff: 'badge-blue', Student: 'badge-green' };

const Navbar = ({ links = [] }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close avatar menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setAvatarOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-jira">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <PharmacyLogo size={32} />
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-brand-800 leading-tight">Campus Health Kiosk</div>
              <div className="text-[10px] text-slate-500 leading-tight">Al Akhawayn University</div>
            </div>
          </Link>

          {/* Desktop links */}
          {links.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ label, to, active }) => (
                <Link key={to} to={to}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${active
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setAvatarOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-haspopup="true"
                  aria-expanded={avatarOpen}
                >
                  {/* Avatar circle */}
                  <div className="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown size={14} className={`text-slate-500 transition-transform ${avatarOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Avatar dropdown popup */}
                {avatarOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-jira-lg z-50 overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-brand-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-semibold">{initials}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                          <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          <span className={`mt-0.5 ${roleBadgeClass[user.role] || 'badge-gray'} badge`}>{user.role}</span>
                        </div>
                      </div>
                    </div>
                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={() => { setAvatarOpen(false); navigate('/profile'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User size={15} className="text-slate-500" />
                        Profile
                      </button>
                      <button
                        onClick={() => { setAvatarOpen(false); navigate('/settings'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings size={15} className="text-slate-500" />
                        Settings
                      </button>
                    </div>
                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            {links.length > 0 && (
              <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-1.5 rounded hover:bg-slate-100">
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && links.length > 0 && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-2 space-y-1">
          {links.map(({ label, to, active }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
