import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Ticket, Clock, CheckCircle, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/common/Navbar';
import ScrollToTopButton from '../components/common/ScrollToTopButton';
import api from '../utils/api';
import toast from 'react-hot-toast';

const statusConfig = {
  Active:      { label: 'Active',   cls: 'badge-green',  icon: <Clock size={10} /> },
  Expired:     { label: 'Expired',  cls: 'badge-yellow', icon: <XCircle size={10} /> },
  Redeemed:    { label: 'Redeemed', cls: 'badge-blue',   icon: <CheckCircle size={10} /> },
  Invalidated: { label: 'Voided',   cls: 'badge-red',    icon: <XCircle size={10} /> },
};

// ── Live countdown ────────────────────────────────────────────────────────────
const CountdownTimer = ({ expiresAt }) => {
  const calc = () => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return null;
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { m, s, diff };
  };

  const [state, setState] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!state) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-0.5">
        <XCircle size={11} /> Expired
      </span>
    );
  }

  const urgent  = state.diff < 5  * 60 * 1000;
  const warning = state.diff < 15 * 60 * 1000;

  const colorCls = urgent
    ? 'text-red-600 bg-red-50 border-red-200'
    : warning
    ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold border rounded-md px-2 py-0.5 ${colorCls}`}>
      <Clock size={11} />
      {state.m}:{state.s.toString().padStart(2, '0')} left
    </span>
  );
};

// ── Single token row ──────────────────────────────────────────────────────────
const TokenRow = ({ token, showQR, setShowQR, onExpired }) => {
  const [isActive, setIsActive] = useState(
    token.tokenStatus === 'Issued' && new Date(token.expiresAt) > new Date()
  );

  useEffect(() => {
    if (token.tokenStatus !== 'Issued') return;
    const id = setInterval(() => {
      const still = new Date(token.expiresAt) > new Date();
      if (!still) {
        setIsActive(false);
        clearInterval(id);
        onExpired(token._id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [token.expiresAt, token.tokenStatus]);

  const displayStatus = token.tokenStatus === 'Issued'
    ? (isActive ? 'Active' : 'Expired')
    : token.tokenStatus;

  const cfg = statusConfig[displayStatus] || statusConfig.Active;

  return (
    <div className={`card p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${!isActive && token.tokenStatus === 'Issued' ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`${cfg.cls} flex items-center gap-1`}>{cfg.icon}{cfg.label}</span>
          <span className="text-xs text-slate-500">{token.product?.category}</span>
        </div>
        <p className="font-semibold text-slate-900 text-sm truncate">{token.product?.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Issued: {new Date(token.issuedAt).toLocaleString()} ·{' '}
          Expires: {new Date(token.expiresAt).toLocaleString()}
        </p>
        {token.tokenStatus === 'Issued' && (
          <div className="mt-1.5">
            <CountdownTimer expiresAt={token.expiresAt} />
          </div>
        )}
        <p className="font-mono text-[10px] text-slate-400 mt-1 truncate">{token.tokenId}</p>
      </div>

      {isActive && (
        <button
          onClick={() => setShowQR(showQR === token.tokenId ? null : token.tokenId)}
          className="btn-secondary text-xs flex-shrink-0"
        >
          {showQR === token.tokenId ? 'Hide QR' : 'Show QR'}
        </button>
      )}

      {isActive && showQR === token.tokenId && (
        <div className="w-full sm:w-auto flex justify-center">
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl">
            <QRCodeSVG value={token.tokenId} size={120} level="H" fgColor="#166534" bgColor="transparent" />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const MyTokens = () => {
  const location = useLocation();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(null);
  // Tracks which token IDs have expired client-side so grouping updates instantly
  const [clientExpired, setClientExpired] = useState(new Set());

  const navLinks = [
    { label: 'Catalog',   to: '/portal',        active: false },
    { label: 'My Tokens', to: '/portal/tokens', active: true  },
  ];

  useEffect(() => { fetchTokens(); }, []);

  const fetchTokens = async () => {
    setLoading(true);
    setClientExpired(new Set());
    try {
      const { data } = await api.get('/tokens/my');
      setTokens(data.tokens);
    } catch { toast.error('Failed to load tokens'); }
    finally { setLoading(false); }
  };

  // Called by TokenRow the moment its timer hits zero
  const handleExpired = (tokenId) => {
    setClientExpired(prev => new Set(prev).add(tokenId));
    setShowQR(prev => prev === tokenId ? null : prev);
  };

  // Active = DB says Issued + not yet past expiresAt + not flagged by client timer
  const isEffectivelyActive = (t) =>
    t.tokenStatus === 'Issued' &&
    new Date(t.expiresAt) > new Date() &&
    !clientExpired.has(t._id);

  const grouped = tokens.reduce((acc, t) => {
    const key = isEffectivelyActive(t) ? 'active' : 'history';
    acc[key] = [...(acc[key] || []), t];
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar links={navLinks} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">My Tokens</h1>
            <p className="text-sm text-slate-500 mt-0.5">Your dispensing token history</p>
          </div>
          <button onClick={fetchTokens} disabled={loading} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({length:4}).map((_,i) => (
              <div key={i} className="card h-20 animate-pulse bg-slate-100"/>
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Ticket size={40} className="text-slate-300" />
            <p className="text-sm text-slate-500">No tokens yet — request one from the catalog</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.active?.length > 0 && (
              <section>
                <p className="section-label mb-3">Active Tokens ({grouped.active.length})</p>
                <div className="space-y-3">
                  {grouped.active.map((t) => (
                    <TokenRow
                      key={t._id}
                      token={t}
                      showQR={showQR}
                      setShowQR={setShowQR}
                      onExpired={handleExpired}
                    />
                  ))}
                </div>
              </section>
            )}
            {grouped.history?.length > 0 && (
              <section>
                <p className="section-label mb-3">History</p>
                <div className="space-y-3">
                  {grouped.history.map((t) => (
                    <TokenRow
                      key={t._id}
                      token={t}
                      showQR={showQR}
                      setShowQR={setShowQR}
                      onExpired={handleExpired}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <ScrollToTopButton />
    </div>
  );
};

export default MyTokens;