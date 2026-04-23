import { ShoppingBag, Clock, CheckCircle, AlertCircle, Tag } from 'lucide-react';

const categoryColors = {
  'First Aid':  'bg-red-50 text-red-700 border-red-200',
  'Hygiene':    'bg-blue-50 text-blue-700 border-blue-200',
  'Wellness':   'bg-purple-50 text-purple-700 border-purple-200',
  'Vitamins':   'bg-orange-50 text-orange-700 border-orange-200',
  'Other':      'bg-slate-50 text-slate-700 border-slate-200',
};

const categoryIcons = {
  'First Aid': '🩹', 'Hygiene': '🧴', 'Wellness': '💊', 'Vitamins': '🍊', 'Other': '📦',
};

const ProductCard = ({ product, onRequest, requesting, hasActiveToken }) => {
  const qty = product.inventory?.quantityOnHand ?? 0;
  const isAvailable = product.availabilityStatus === 'Available' && qty > 0;
  const isLowStock = qty > 0 && qty <= 3;
  const colorClass = categoryColors[product.category] || categoryColors['Other'];

  return (
    <div className={`card flex flex-col h-full transition-shadow hover:shadow-jira-md ${!isAvailable ? 'opacity-70' : ''}`}>
      {/* Category banner */}
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 rounded-t-lg ${colorClass.split(' ').slice(0,1).join(' ')} bg-opacity-40`}>
        <span className="text-base">{categoryIcons[product.category] || '📦'}</span>
        <span className={`text-xs font-semibold ${colorClass.split(' ')[1]}`}>{product.category}</span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Name */}
        <h3 className="text-sm font-semibold text-slate-900 mb-1 leading-snug">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-slate-500 mb-3 flex-1 leading-relaxed">{product.description}</p>
        )}

        {/* Stock indicator */}
        <div className="flex items-center gap-2 mb-4">
          {isAvailable ? (
            isLowStock ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                <AlertCircle size={11} /> Low stock ({qty} left)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50 border border-brand-200 px-2 py-1 rounded">
                <CheckCircle size={11} /> In stock ({qty} available)
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
              <AlertCircle size={11} /> {qty === 0 ? 'Out of stock' : 'Unavailable'}
            </span>
          )}
        </div>

        {/* CTA */}
        {hasActiveToken ? (
          <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50 border border-brand-200 px-3 py-2 rounded">
            <Clock size={12} /> Token already issued for this item
          </div>
        ) : (
          <button
            onClick={() => onRequest(product)}
            disabled={!isAvailable || requesting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {requesting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingBag size={14} />
            )}
            {requesting ? 'Requesting…' : 'Request Token'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
