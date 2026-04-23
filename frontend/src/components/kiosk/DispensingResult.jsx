import { CheckCircle, XCircle, Clock, RotateCcw, Mail } from 'lucide-react';

const REJECTION_MESSAGES = {
  Invalid:        { title: 'Invalid Token',      detail: 'This token could not be verified. Please request a new one.' },
  Expired:        { title: 'Token Expired',      detail: 'This token has expired. Please request a new one from the student portal.' },
  Reused:         { title: 'Already Redeemed',   detail: 'This token has already been used and cannot be redeemed again.' },
  'Out-of-stock': { title: 'Out of Stock',       detail: 'The requested product is currently out of stock.' },
  'Limit-exceeded':{ title: 'Limit Reached',     detail: 'You have reached your dispensing limit for this period.' },
};

const DispensingResult = ({ result, onReset }) => {
  const isSuccess = result.success;
  const rejection = result.reason ? REJECTION_MESSAGES[result.reason] : null;

  return (
    <div className={`flex flex-col items-center text-center p-8 rounded-2xl border-2 ${
      isSuccess ? 'bg-brand-50 border-brand-200' : 'bg-red-50 border-red-200'
    }`}>
      {/* Icon */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
        isSuccess ? 'bg-brand-100' : 'bg-red-100'
      }`}>
        {isSuccess
          ? <CheckCircle size={40} className="text-brand-700" />
          : <XCircle size={40} className="text-red-600" />
        }
      </div>

      {/* Status */}
      <h2 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-brand-800' : 'text-red-700'}`}>
        {isSuccess ? 'Dispensed!' : (rejection?.title || 'Redemption Failed')}
      </h2>

      {isSuccess ? (
        <>
          <p className="text-lg font-semibold text-slate-800 mb-1">{result.productName}</p>
          <p className="text-sm text-slate-600 mb-4">Please collect your item from the slot below.</p>

          {result.emailSent && (
            <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50 border border-brand-200 px-4 py-2 rounded-full mb-4">
              <Mail size={12} />
              Confirmation email sent to your campus email
            </div>
          )}

          <div className="bg-white border border-brand-200 rounded-xl px-6 py-3 mb-6">
            <p className="text-xs text-slate-500">Dispensed to</p>
            <p className="font-semibold text-slate-900">{result.userName}</p>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600 mb-6 max-w-xs leading-relaxed">
          {rejection?.detail || result.message || 'An error occurred during redemption.'}
        </p>
      )}

      {/* Auto-reset countdown hint */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
        <Clock size={12} />
        Screen resets automatically in 10 seconds
      </div>

      <button onClick={onReset} className={`flex items-center gap-2 ${isSuccess ? 'btn-primary' : 'btn-danger'}`}>
        <RotateCcw size={14} />
        Scan Another Token
      </button>
    </div>
  );
};

export default DispensingResult;
