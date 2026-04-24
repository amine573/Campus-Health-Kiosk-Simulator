import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, IdCard, ShieldCheck, Clock, KeyRound, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const roleBadgeClass = { Administrator: 'badge-red', Staff: 'badge-blue', Student: 'badge-green' };

const Profile = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const backTo = user?.role === 'Administrator' ? '/admin' : '/portal';

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error('Name cannot be empty');
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/profile', profileForm);
      // Update the stored user so Navbar reflects the new name/email immediately
      const token = localStorage.getItem('chk_token');
      login(token, data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwordForm.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    setSavingPassword(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* Back link */}
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="page-title">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your account information and password</p>
        </div>

        {/* Account overview card */}
        <div className="card p-6 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-700 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`badge ${roleBadgeClass[user?.role] || 'badge-gray'}`}>{user?.role}</span>
                <span className="badge badge-gray">{user?.campusId}</span>
              </div>
            </div>
          </div>

          {/* Read-only info grid */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: IdCard,      label: 'Campus ID',    value: user?.campusId },
              { icon: ShieldCheck, label: 'Role',         value: user?.role },
              { icon: Clock,       label: 'Last login',   value: user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A' },
              { icon: User,        label: 'Account status', value: user?.status || 'Active' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <Icon size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-slate-700 font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit profile card */}
        <div className="card p-6 mb-5">
          <div className="flex items-center gap-2 mb-5">
            <User size={17} className="text-brand-700" />
            <h2 className="text-sm font-semibold text-slate-900">Edit Profile</h2>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5"><User size={12} /> Full Name</span>
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                className="input"
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Mail size={12} /> Email Address</span>
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
              {savingProfile
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Save size={14} />}
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password card */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <KeyRound size={17} className="text-brand-700" />
            <h2 className="text-sm font-semibold text-slate-900">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {/* New password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  className="input pr-10"
                  placeholder="Min. 8 characters"
                  required
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {/* Confirm new password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="input pr-10"
                  placeholder="Repeat new password"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Match indicator */}
              {passwordForm.confirmPassword && (
                <p className={`text-xs mt-1 ${passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>
            <button type="submit" disabled={savingPassword} className="btn-primary flex items-center gap-2">
              {savingPassword
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <KeyRound size={14} />}
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
};

export default Profile;