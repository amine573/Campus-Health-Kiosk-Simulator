import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

let Html5Qrcode;

const QRScanner = ({ onScan, onError }) => {
  const scannerRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const instanceRef = useRef(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    // Lazy load html5-qrcode to avoid SSR issues
    import('html5-qrcode').then((mod) => {
      Html5Qrcode = mod.Html5Qrcode;
      startScanner();
    });
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    if (!Html5Qrcode) return;
    try {
      const instance = new Html5Qrcode('qr-scanner-region');
      instanceRef.current = instance;
      await instance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (!scannedRef.current) {
            scannedRef.current = true;
            stopScanner();
            onScan(decodedText);
          }
        },
        () => {} // ignore frame errors
      );
      setStarted(true);
    } catch (err) {
      if (err?.toString().includes('Permission')) setPermissionDenied(true);
      onError?.(err?.toString() || 'Camera error');
    }
  };

  const stopScanner = async () => {
    if (instanceRef.current) {
      try { await instanceRef.current.stop(); } catch (_) {}
      instanceRef.current = null;
    }
    setStarted(false);
  };

  const restart = () => {
    scannedRef.current = false;
    startScanner();
  };

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <CameraOff size={40} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-700">Camera access denied</p>
        <p className="text-xs text-slate-500">Please allow camera access in your browser settings and reload the page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm">
        {/* Scanner region */}
        <div id="qr-scanner-region" className="w-full rounded-xl overflow-hidden border-2 border-brand-300 bg-black min-h-[280px]" />

        {/* Corner guides overlay */}
        {started && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 relative">
              {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 ${cls} border-brand-400 rounded-sm`} />
              ))}
              {/* Scanning line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-400 opacity-80" style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
            </div>
          </div>
        )}

        {/* Loading state */}
        {!started && !permissionDenied && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-xl">
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Initializing camera…</p>
            </div>
          </div>
        )}
      </div>

      <button onClick={restart} className="btn-secondary flex items-center gap-2 text-xs">
        <Camera size={14} /> Restart Scanner
      </button>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { top: calc(100% - 2px); }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
