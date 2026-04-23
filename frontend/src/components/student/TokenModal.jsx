import { X, Clock, CheckCircle, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

const TokenModal = ({ token, onClose }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(token.expiresAt) - new Date();
      if (diff <= 0) { setExpired(true); setTimeLeft('Expired'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [token.expiresAt]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-jira-lg w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-brand-700 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span className="font-semibold text-sm">Token Issued</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-brand-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* Product info */}
          <div className="text-center mb-4">
            <p className="text-xs text-slate-500 mb-0.5">Product</p>
            <p className="text-base font-semibold text-slate-900">{token.product?.name}</p>
            <p className="text-xs text-slate-500">{token.product?.category}</p>
          </div>

          {/* QR Code */}
          <div className={`flex justify-center mb-4 p-4 rounded-xl border-2 ${expired ? 'border-red-300 bg-red-50' : 'border-brand-200 bg-brand-50'}`}>
            <div className={expired ? 'opacity-30' : ''}>
              <QRCodeSVG
                value={token.tokenId}
                size={160}
                level="H"
                fgColor={expired ? '#dc2626' : '#166534'}
                bgColor="transparent"
              />
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center justify-center gap-2 mb-4 px-4 py-2.5 rounded-lg ${expired ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
            <Clock size={14} className={expired ? 'text-red-500' : 'text-slate-500'} />
            <span className={`font-mono text-sm font-semibold ${expired ? 'text-red-600' : 'text-slate-700'}`}>
              {expired ? 'Token Expired' : `Expires in ${timeLeft}`}
            </span>
          </div>

          {/* Token ID */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4">
            <p className="text-[10px] text-slate-500 mb-0.5">Token ID</p>
            <p className="font-mono text-xs text-slate-700 break-all">{token.tokenId}</p>
          </div>

          {/* Instructions */}
          <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Scan this QR code at the campus health kiosk to collect your item. Token is single-use and expires in {token.expiresInMinutes} minutes.
            </p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TokenModal;
