import { useState } from 'react';
import { AlertTriangle, Trash2, X, ChevronRight } from 'lucide-react';

const STEPS = ['confirm', 'verify'];

const DeleteConfirmWizard = ({ product, onConfirm, onCancel, loading }) => {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState('');

  const isVerified = typed.trim().toLowerCase() === product?.name?.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-jira-lg w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 size={16} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Delete Product</h2>
              <p className="text-xs text-slate-500">Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-5 pt-4 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-red-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* Step 0 — Initial confirmation */}
        {step === 0 && (
          <div className="px-5 py-5">
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-5">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">This action will disable the product</p>
                <p className="text-xs text-amber-700 mt-1">
                  The product will be marked as <strong>Disabled</strong> and hidden from the catalog.
                  This can be undone immediately after.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-5">
              <p className="text-xs text-slate-500 mb-1 font-medium">Product to disable</p>
              <p className="text-sm font-semibold text-slate-900">{product?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{product?.category}</p>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={onCancel} className="btn-secondary">Cancel</button>
              <button onClick={() => setStep(1)} className="btn-danger flex items-center gap-1.5">
                Continue <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Type to verify */}
        {step === 1 && (
          <div className="px-5 py-5">
            <p className="text-sm text-slate-700 mb-4">
              To confirm, type the product name below:
            </p>
            <p className="text-xs font-mono bg-slate-100 text-slate-800 px-3 py-2 rounded mb-3 border border-slate-200">
              {product?.name}
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type product name to confirm..."
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setStep(0); setTyped(''); }} className="btn-secondary">Back</button>
              <button
                onClick={() => { if (isVerified) onConfirm(); }}
                disabled={!isVerified || loading}
                className="btn-danger flex items-center gap-1.5 disabled:opacity-40"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {loading ? 'Disabling…' : 'Disable Product'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteConfirmWizard;
