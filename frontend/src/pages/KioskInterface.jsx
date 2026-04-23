import { useState, useEffect } from 'react';
import { Monitor, Keyboard, QrCode } from 'lucide-react';
import PharmacyLogo from '../assets/PharmacyLogo';
import QRScanner from '../components/kiosk/QRScanner';
import DispensingResult from '../components/kiosk/DispensingResult';
import api from '../utils/api';

const MODES = { IDLE: 'idle', SCANNING: 'scanning', PROCESSING: 'processing', RESULT: 'result' };
const RESET_DELAY = 10000;

const KioskInterface = () => {
  const [mode, setMode] = useState(MODES.IDLE);
  const [result, setResult] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [inputMode, setInputMode] = useState('qr'); // 'qr' | 'manual'

  // Auto-reset after result
  useEffect(() => {
    if (mode === MODES.RESULT) {
      const id = setTimeout(reset, RESET_DELAY);
      return () => clearTimeout(id);
    }
  }, [mode]);

  const reset = () => {
    setMode(MODES.IDLE);
    setResult(null);
    setManualToken('');
    setInputMode('qr');
  };

  const processToken = async (tokenId) => {
    setMode(MODES.PROCESSING);
    try {
      const { data } = await api.post('/tokens/redeem', { tokenId: tokenId.trim() });
      setResult({ success: true, ...data });
    } catch (err) {
      const errData = err.response?.data || {};
      setResult({ success: false, message: errData.message || 'Redemption failed', reason: errData.reason });
    }
    setMode(MODES.RESULT);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) processToken(manualToken.trim());
  };

  return (
    <div className="min-h-screen bg-brand-900 flex flex-col">
      {/* Kiosk header */}
      <div className="bg-brand-950 px-6 py-4 flex items-center justify-between border-b border-brand-800">
        <div className="flex items-center gap-3">
          <PharmacyLogo size={32} />
          <div>
            <p className="text-white font-semibold text-sm">Campus Health Kiosk</p>
            <p className="text-brand-400 text-xs">Al Akhawayn University in Ifrane</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-brand-400 text-xs font-medium">ONLINE</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* IDLE */}
          {mode === MODES.IDLE && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-brand-800 rounded-3xl flex items-center justify-center border border-brand-700">
                  <QrCode size={44} className="text-brand-300" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Ready to Dispense</h1>
              <p className="text-brand-300 text-sm mb-8">Scan your QR token or enter it manually to collect your health product.</p>

              <div className="space-y-3">
                <button
                  onClick={() => { setInputMode('qr'); setMode(MODES.SCANNING); }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-700 hover:bg-brand-600 text-white rounded-xl font-semibold transition-colors"
                >
                  <Monitor size={20} />
                  Scan QR Code
                </button>
                <button
                  onClick={() => { setInputMode('manual'); setMode(MODES.SCANNING); }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-colors border border-white/20"
                >
                  <Keyboard size={20} />
                  Enter Token Manually
                </button>
              </div>

              <p className="text-brand-500 text-xs mt-8">Non-medicine health products only · Single-use tokens</p>
            </div>
          )}

          {/* SCANNING */}
          {mode === MODES.SCANNING && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-jira-lg">
              <div className="px-5 py-4 border-b border-slate-200 bg-brand-50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm">
                    {inputMode === 'qr' ? 'Scan QR Code' : 'Enter Token ID'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {inputMode === 'qr' ? 'Position QR code within the frame' : 'Type or paste your token ID'}
                  </p>
                </div>
                <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100">
                  Cancel
                </button>
              </div>

              <div className="p-5">
                {inputMode === 'qr' ? (
                  <QRScanner
                    onScan={processToken}
                    onError={() => {}}
                  />
                ) : (
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <textarea
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Paste token ID here…"
                      rows={3}
                      className="input font-mono text-xs resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={reset} className="btn-secondary flex-1">Cancel</button>
                      <button type="submit" disabled={!manualToken.trim()} className="btn-primary flex-1">Redeem</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {mode === MODES.PROCESSING && (
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
              <p className="text-white text-lg font-semibold">Processing Token…</p>
              <p className="text-brand-400 text-sm mt-2">Verifying and dispensing your item</p>
            </div>
          )}

          {/* RESULT */}
          {mode === MODES.RESULT && result && (
            <DispensingResult result={result} onReset={reset} />
          )}
        </div>
      </div>

      {/* Footer clock */}
      <div className="text-center pb-4">
        <p className="text-brand-600 text-xs">
          {new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export default KioskInterface;
