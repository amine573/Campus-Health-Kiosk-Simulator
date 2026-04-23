import { useEffect, useState } from 'react';
import { RotateCcw, X, CheckCircle } from 'lucide-react';

const UndoToast = ({ message, onUndo, onDismiss, duration = 6000 }) => {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) { clearInterval(interval); handleDismiss(); }
    }, 50);
    return () => clearInterval(interval);
  }, [duration]);

  const handleDismiss = () => { setVisible(false); setTimeout(onDismiss, 200); };
  const handleUndo = () => { setVisible(false); setTimeout(onUndo, 200); };

  return (
    <div
      className={`undo-toast fixed bottom-20 right-6 z-50 w-80 bg-slate-900 text-white rounded-xl shadow-jira-lg overflow-hidden transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-slate-700">
        <div
          className="h-full bg-brand-400 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <CheckCircle size={16} className="text-brand-400 flex-shrink-0" />
        <span className="text-sm flex-1 text-slate-200">{message}</span>
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0 px-2 py-1 rounded hover:bg-slate-800"
        >
          <RotateCcw size={12} />
          Undo
        </button>
        <button onClick={handleDismiss} className="p-0.5 rounded hover:bg-slate-800 transition-colors flex-shrink-0">
          <X size={14} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
};

export default UndoToast;
