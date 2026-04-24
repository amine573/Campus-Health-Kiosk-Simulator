import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package, BarChart3, FileText, Settings2, Plus, Tag,
  Trash2, RotateCcw, Download, Search, RefreshCw, Pencil, X,
  TrendingUp, CheckCircle, XCircle,
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import DeleteConfirmWizard from '../components/admin/DeleteConfirmWizard';
import UndoToast from '../components/admin/UndoToast';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: BarChart3  },
  { id: 'inventory',  label: 'Inventory',  icon: Package    },
  { id: 'categories', label: 'Categories', icon: Tag        },
  { id: 'logs',       label: 'Audit Logs', icon: FileText   },
  { id: 'policy',     label: 'Policy',     icon: Settings2  },
];

const VALID_TABS = new Set(TABS.map(t => t.id));

const statusBadge = (s) => {
  const map = { Available: 'badge-green', Unavailable: 'badge-yellow', Disabled: 'badge-red' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

// ── Reusable checkbox ─────────────────────────────────────────────────────────
const Checkbox = ({ checked, indeterminate = false, onChange }) => (
  <input
    type="checkbox"
    checked={checked}
    ref={el => { if (el) el.indeterminate = indeterminate; }}
    onChange={onChange}
    className="w-4 h-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
  />
);

// ── Selection action bar ──────────────────────────────────────────────────────
const SelectionBar = ({ count, onClear, children }) => (
  count > 0 ? (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-50 border border-brand-200 rounded-lg">
      <span className="text-sm font-medium text-brand-800">{count} selected</span>
      <div className="flex items-center gap-2 ml-auto">
        {children}
        <button onClick={onClear} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100">
          Clear
        </button>
      </div>
    </div>
  ) : null
);

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
const DashboardTab = ({ onCardClick }) => {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    api.get('/audit/summary').then(r => setSummary(r.data.summary)).catch(() => {});
  }, []);

  if (!summary) return <div className="animate-pulse h-40 bg-slate-100 rounded-lg" />;

  const cards = [
    {
      label: 'Tokens Issued',
      value: summary.totalIssued,
      icon: CheckCircle,
      color: 'text-brand-700',
      bg: 'bg-brand-50 border-brand-200',
      hover: 'hover:bg-brand-100 hover:border-brand-400',
      filter: { eventType: 'TokenIssued', outcome: 'Success' },
    },
    {
      label: 'Tokens Redeemed',
      value: summary.totalRedeemed,
      icon: TrendingUp,
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
      hover: 'hover:bg-blue-100 hover:border-blue-400',
      filter: { eventType: 'TokenRedeemed', outcome: 'Success' },
    },
    {
      label: 'Failed Attempts',
      value: summary.totalFailed,
      icon: XCircle,
      color: 'text-red-700',
      bg: 'bg-red-50 border-red-200',
      hover: 'hover:bg-red-100 hover:border-red-400',
      filter: { eventType: 'TokenRedeemed', outcome: 'Failure' },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, hover, filter }) => (
          <button
            key={label}
            onClick={() => onCardClick(filter)}
            className={`card p-5 border ${bg} ${hover} transition-colors cursor-pointer text-left w-full group`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-400 mt-1 group-hover:text-slate-600 transition-colors">
              Click to view logs →
            </p>
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <p className="text-sm font-semibold text-slate-700">Recent Activity</p>
        </div>
        <div className="divide-y divide-slate-100">
          {summary.recentActivity.length === 0 && (
            <p className="px-5 py-4 text-sm text-slate-400">No recent activity</p>
          )}
          {summary.recentActivity.map((a) => (
            <div key={a._id} className="flex items-center gap-3 px-5 py-3">
              <span className={`badge ${a.eventOutcome === 'Success' ? 'badge-green' : 'badge-red'}`}>{a.eventType}</span>
              <span className="text-sm text-slate-700 flex-1">{a.actor?.name || 'System'}</span>
              <span className="text-xs text-slate-400">{new Date(a.eventTimestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Inventory Tab ────────────────────────────────────────────────────────────
const InventoryTab = () => {
  const [products, setProducts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editQty, setEditQty]           = useState({});
  const [savingId, setSavingId]         = useState(null);
  const [search, setSearch]             = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [undoData, setUndoData]         = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [newProduct, setNewProduct]     = useState({ name: '', category: '', description: '', initialQuantity: 10 });
  const [selected, setSelected]         = useState(new Set());

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/products'); setProducts(r.data.products); }
    catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchProducts();
    api.get('/categories').then(r => {
      setCategories(r.data.categories);
      if (r.data.categories.length > 0) setNewProduct(p => ({ ...p, category: r.data.categories[0].name }));
    }).catch(() => {});
  }, [fetchProducts]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const allIds       = filtered.map(p => p._id);
  const allSelected  = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id)) && !allSelected;
  const toggleAll    = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne    = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const clearSel     = () => setSelected(new Set());

  const bulkDisable = async () => {
    const ids = [...selected].filter(id => { const p = products.find(x => x._id === id); return p && p.availabilityStatus !== 'Disabled'; });
    await Promise.all(ids.map(id => api.delete(`/products/${id}`)));
    toast.success(`${ids.length} product(s) disabled`);
    clearSel(); fetchProducts();
  };

  const saveQty = async (productId) => {
    const qty = parseInt(editQty[productId]);
    if (isNaN(qty) || qty < 0) return toast.error('Invalid quantity');
    setSavingId(productId);
    try { await api.patch(`/inventory/${productId}`, { quantityOnHand: qty }); toast.success('Inventory updated'); fetchProducts(); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSavingId(null); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/products/${deleteTarget._id}`);
      const deleted = deleteTarget;
      setDeleteTarget(null);
      setProducts(p => p.filter(x => x._id !== deleted._id));
      setUndoData(deleted);
    } catch { toast.error('Delete failed'); }
    finally { setDeleteLoading(false); }
  };

  const handleUndo = async () => {
    try { await api.patch(`/products/${undoData._id}/restore`); toast.success(`"${undoData.name}" restored`); setUndoData(null); fetchProducts(); }
    catch { toast.error('Restore failed'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', newProduct);
      toast.success('Product created');
      setShowForm(false);
      setNewProduct({ name: '', category: categories[0]?.name || '', description: '', initialQuantity: 10 });
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="input pl-9" />
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={fetchProducts} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-5 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-800">New Product</p>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100"><X size={14} className="text-slate-500" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
              <input required value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} className="input" placeholder="Product name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category *</label>
              <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} className="input">
                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <input value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} className="input" placeholder="Optional description" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Initial Quantity</label>
              <input type="number" min="0" value={newProduct.initialQuantity} onChange={e => setNewProduct(p => ({ ...p, initialQuantity: parseInt(e.target.value) || 0 }))} className="input" />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Product</button>
            </div>
          </form>
        </div>
      )}

      <SelectionBar count={selected.size} onClear={clearSel}>
        <button onClick={bulkDisable} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 border border-red-200">
          <Trash2 size={12} /> Disable selected
        </button>
      </SelectionBar>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-3 w-10"><Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} /></th>
                {['Product', 'Category', 'Status', 'Stock', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
              )) : filtered.map(p => (
                <tr key={p._id} className={`hover:bg-slate-50 ${selected.has(p._id) ? 'bg-brand-50/40' : ''} ${p.availabilityStatus === 'Disabled' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3"><Checkbox checked={selected.has(p._id)} onChange={() => toggleOne(p._id)} /></td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 text-sm">{p.name}</p>
                    {p.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{p.category}</span></td>
                  <td className="px-4 py-3">{statusBadge(p.availabilityStatus)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input type="number" min="0"
                        value={editQty[p._id] ?? p.inventory?.quantityOnHand ?? 0}
                        onChange={e => setEditQty(q => ({ ...q, [p._id]: e.target.value }))}
                        className="w-20 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      {editQty[p._id] !== undefined && (
                        <button onClick={() => saveQty(p._id)} disabled={savingId === p._id} className="btn-primary py-1 px-2 text-xs">
                          {savingId === p._id ? '…' : 'Save'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.availabilityStatus === 'Disabled' ? (
                      <button onClick={async () => { await api.patch(`/products/${p._id}/restore`); toast.success('Restored'); fetchProducts(); }}
                        className="flex items-center gap-1 text-xs text-brand-700 hover:text-brand-800 px-2 py-1 rounded hover:bg-brand-50">
                        <RotateCcw size={12} /> Restore
                      </button>
                    ) : (
                      <button onClick={() => setDeleteTarget(p)}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                        <Trash2 size={12} /> Disable
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && <DeleteConfirmWizard product={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
      {undoData && <UndoToast message={`"${undoData.name}" has been disabled`} onUndo={handleUndo} onDismiss={() => setUndoData(null)} />}
    </div>
  );
};

// ─── Categories Tab ───────────────────────────────────────────────────────────
const CategoriesTab = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState({ name: '', description: '' });
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(new Set());

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/categories/all'); setCategories(r.data.categories); }
    catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const allIds       = filtered.map(c => c._id);
  const allSelected  = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id)) && !allSelected;
  const toggleAll    = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne    = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const clearSel     = () => setSelected(new Set());

  const bulkDeactivate = async () => {
    const ids = [...selected].filter(id => { const c = categories.find(x => x._id === id); return c && c.isActive; });
    const results = await Promise.allSettled(ids.map(id => api.delete(`/categories/${id}`)));
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length) toast.error(`${failed.length} category(s) could not be deactivated`);
    const ok = ids.length - failed.length;
    if (ok > 0) toast.success(`${ok} category(s) deactivated`);
    clearSel(); fetchCategories();
  };

  const openCreate = () => { setEditTarget(null); setForm({ name: '', description: '' }); setShowForm(true); };
  const openEdit   = (cat) => { setEditTarget(cat); setForm({ name: cat.name, description: cat.description || '' }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) { await api.patch(`/categories/${editTarget._id}`, form); toast.success('Category updated'); }
      else            { await api.post('/categories', form); toast.success('Category created'); }
      setShowForm(false); fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (cat) => {
    try { await api.patch(`/categories/${cat._id}`, { isActive: !cat.isActive }); toast.success(cat.isActive ? 'Category deactivated' : 'Category reactivated'); fetchCategories(); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handleDelete = async (cat) => {
    try { await api.delete(`/categories/${cat._id}`); toast.success('Category deactivated'); fetchCategories(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories…" className="input pl-9" />
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={fetchCategories} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Add Category
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-5 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-800">{editTarget ? 'Edit Category' : 'New Category'}</p>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100"><X size={14} className="text-slate-500" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="e.g. Mental Health" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Optional short description" />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? 'Saving…' : editTarget ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <SelectionBar count={selected.size} onClear={clearSel}>
        <button onClick={bulkDeactivate} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 border border-red-200">
          <Trash2 size={12} /> Deactivate selected
        </button>
      </SelectionBar>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-3 w-10"><Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} /></th>
                {['Name', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No categories found</td></tr>
              ) : filtered.map(cat => (
                <tr key={cat._id} className={`hover:bg-slate-50 ${selected.has(cat._id) ? 'bg-brand-50/40' : ''} ${!cat.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3"><Checkbox checked={selected.has(cat._id)} onChange={() => toggleOne(cat._id)} /></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[220px] truncate">{cat.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${cat.isActive ? 'badge-green' : 'badge-yellow'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(cat)} className="flex items-center gap-1 text-xs text-slate-600 hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50">
                        <Pencil size={11} /> Edit
                      </button>
                      {cat.isActive ? (
                        <button onClick={() => handleDelete(cat)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                          <Trash2 size={11} /> Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleToggle(cat)} className="flex items-center gap-1 text-xs text-brand-700 hover:text-brand-800 px-2 py-1 rounded hover:bg-brand-50">
                          <RotateCcw size={11} /> Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Audit Logs Tab ───────────────────────────────────────────────────────────
const AuditLogsTab = ({ initialFilter = {} }) => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState({ eventType: initialFilter.eventType || '', outcome: initialFilter.outcome || '' });
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected]   = useState(new Set());

  useEffect(() => {
    setFilter({ eventType: initialFilter.eventType || '', outcome: initialFilter.outcome || '' });
  }, [initialFilter.eventType, initialFilter.outcome]);

  useEffect(() => { fetchLogs(); }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.eventType) params.set('eventType', filter.eventType);
      if (filter.outcome)   params.set('outcome', filter.outcome);
      const r = await api.get(`/audit?${params}&limit=50`);
      setLogs(r.data.logs);
      setSelected(new Set());
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const r = await api.get('/audit/export/csv', { responseType: 'blob' });
      const blob = new Blob([r.data], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `audit_all_${Date.now()}.csv`;
      a.click();
      toast.success('CSV downloaded');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const exportSelected = () => {
    const rows = logs.filter(l => selected.has(l._id));
    if (!rows.length) return;
    const headers = ['Timestamp', 'Event', 'Actor', 'Role', 'Target', 'Outcome', 'Detail'];
    const csv = [
      headers.join(','),
      ...rows.map(l => [
        new Date(l.eventTimestamp).toLocaleString(),
        l.eventType,
        l.actor?.name || 'System',
        l.actorRole,
        l.targetObjectType || '',
        l.eventOutcome,
        `"${(l.details || '').replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit_selected_${Date.now()}.csv`;
    a.click();
    toast.success(`Exported ${rows.length} row(s)`);
  };

  const allIds       = logs.map(l => l._id);
  const allSelected  = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id)) && !allSelected;
  const toggleAll    = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne    = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const clearSel     = () => setSelected(new Set());

  const EVENT_TYPES = ['', 'Authentication', 'TokenIssued', 'TokenRedeemed', 'InventoryUpdated', 'PolicyUpdated', 'ProductCreated', 'ProductDeleted', 'Logout'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Event Type</label>
          <select value={filter.eventType} onChange={e => setFilter(f => ({ ...f, eventType: e.target.value }))} className="input w-44">
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t || 'All Events'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Outcome</label>
          <select value={filter.outcome} onChange={e => setFilter(f => ({ ...f, outcome: e.target.value }))} className="input w-36">
            <option value="">All</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
          </select>
        </div>
        {(filter.eventType || filter.outcome) && (
          <button
            onClick={() => setFilter({ eventType: '', outcome: '' })}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 border border-slate-200 self-end"
          >
            <X size={11} /> Clear filters
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={exportCSV} disabled={exporting} className="btn-secondary flex items-center gap-2 text-xs">
            <Download size={13} />{exporting ? 'Exporting…' : 'Export All CSV'}
          </button>
        </div>
      </div>

      {(filter.eventType || filter.outcome) && (
        <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
          <FileText size={13} />
          Filtered by:
          {filter.eventType && <span className="font-semibold">{filter.eventType}</span>}
          {filter.eventType && filter.outcome && <span>·</span>}
          {filter.outcome && <span className="font-semibold">{filter.outcome}</span>}
        </div>
      )}

      <SelectionBar count={selected.size} onClear={clearSel}>
        <button onClick={exportSelected} className="flex items-center gap-1.5 text-xs text-brand-700 hover:text-brand-800 px-2 py-1 rounded hover:bg-brand-50 border border-brand-200">
          <Download size={12} /> Export selected
        </button>
      </SelectionBar>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 w-10"><Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} /></th>
                {['Timestamp', 'Event', 'Actor', 'Role', 'Target', 'Outcome', 'Detail'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
              )) : logs.map(log => (
                <tr key={log._id} className={`hover:bg-slate-50 ${selected.has(log._id) ? 'bg-brand-50/40' : ''}`}>
                  <td className="px-4 py-2.5"><Checkbox checked={selected.has(log._id)} onChange={() => toggleOne(log._id)} /></td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap font-mono">{new Date(log.eventTimestamp).toLocaleString()}</td>
                  <td className="px-4 py-2.5"><span className="badge badge-gray text-xs">{log.eventType}</span></td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{log.actor?.name || 'System'}</td>
                  <td className="px-4 py-2.5"><span className="text-xs text-slate-500">{log.actorRole}</span></td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{log.targetObjectType || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${log.eventOutcome === 'Success' ? 'badge-green' : 'badge-red'}`}>{log.eventOutcome}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">{log.details || '—'}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">No logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Policy Tab ───────────────────────────────────────────────────────────────
const PolicyTab = () => {
  const [policy, setPolicy]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ policyScope: 'Both', timeWindow: 'week', maxPerUser: 3, maxPerItem: 1, tokenExpiryMinutes: 30 });
  const [saving, setSaving]     = useState(false);

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/policy');
      if (r.data.policy) {
        setPolicy(r.data.policy);
        setForm({
          policyScope:        r.data.policy.policyScope,
          timeWindow:         r.data.policy.timeWindow,
          maxPerUser:         r.data.policy.maxPerUser,
          maxPerItem:         r.data.policy.maxPerItem,
          tokenExpiryMinutes: r.data.policy.tokenExpiryMinutes ?? 30,
        });
      }
    } catch { toast.error('Failed to load policy'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPolicy(); }, [fetchPolicy]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/inventory/policy', form);
      setPolicy(r.data.policy);
      setShowForm(false);
      toast.success('Policy updated');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const POLICY_ROWS = policy ? [
    { label: 'Policy Scope',                  value: policy.policyScope,                          badge: 'badge-gray'   },
    { label: 'Time Window',                   value: policy.timeWindow,                           badge: 'badge-blue'   },
    { label: 'Max items per user per window', value: String(policy.maxPerUser),                   badge: null           },
    { label: 'Max of same item per window',   value: String(policy.maxPerItem),                   badge: null           },
    { label: 'Token expiry',                  value: `${policy.tokenExpiryMinutes ?? 30} min`,    badge: 'badge-green'  },
    { label: 'Status',                        value: policy.policyStatus,                         badge: policy.policyStatus === 'Active' ? 'badge-green' : 'badge-yellow' },
    { label: 'Last updated',                  value: new Date(policy.updatedAt).toLocaleString(), badge: null           },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <button onClick={fetchPolicy} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Pencil size={14} /> Edit Policy
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-800">Edit Dispensing Policy</p>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100">
              <X size={14} className="text-slate-500" />
            </button>
          </div>
          <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Policy Scope</label>
              <select value={form.policyScope} onChange={e => setForm(f => ({ ...f, policyScope: e.target.value }))} className="input">
                {['Per-user', 'Per-item', 'Both'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Time Window</label>
              <select value={form.timeWindow} onChange={e => setForm(f => ({ ...f, timeWindow: e.target.value }))} className="input">
                {['day', 'week', 'month'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Max items per user per window</label>
              <input type="number" min={0} value={form.maxPerUser} onChange={e => setForm(f => ({ ...f, maxPerUser: parseInt(e.target.value) || 0 }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Max of same item per window</label>
              <input type="number" min={0} value={form.maxPerItem} onChange={e => setForm(f => ({ ...f, maxPerItem: parseInt(e.target.value) || 0 }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Token expiry (minutes)</label>
              <input type="number" min={1} value={form.tokenExpiryMinutes} onChange={e => setForm(f => ({ ...f, tokenExpiryMinutes: parseInt(e.target.value) || 1 }))} className="input" />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? 'Saving…' : 'Save Policy'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                {['Setting', 'Current Value'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 7 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="h-4 w-40 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></td>
                </tr>
              )) : !policy ? (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-400">No active policy found</td></tr>
              ) : POLICY_ROWS.map(({ label, value, badge }) => (
                <tr key={label} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{label}</td>
                  <td className="px-4 py-3">
                    {badge
                      ? <span className={`badge ${badge}`}>{value}</span>
                      : <span className="text-sm text-slate-900 font-semibold">{value}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();

  // Resolve active tab from URL param; fall back to 'dashboard' for unknown values
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : 'dashboard';

  // Redirect if URL param is invalid
  useEffect(() => {
    if (!VALID_TABS.has(tabParam)) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [tabParam, navigate]);

  // logsFilter is stored in component state so card clicks can inject filters
  // into AuditLogsTab even when navigating from dashboard → logs
  const [logsFilter, setLogsFilter] = useState({});

  const handleTabClick = (id) => {
    if (id !== 'logs') setLogsFilter({}); // clear filter when switching away from logs
    navigate(`/admin/${id}`);
  };

  const handleCardClick = (filter) => {
    setLogsFilter(filter);
    navigate('/admin/logs');
  };

  const TAB_CONTENT = {
    dashboard:  <DashboardTab onCardClick={handleCardClick} />,
    inventory:  <InventoryTab />,
    categories: <CategoriesTab />,
    logs:       <AuditLogsTab key={JSON.stringify(logsFilter)} initialFilter={logsFilter} />,
    policy:     <PolicyTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        <div className="mb-6">
          <h1 className="page-title">Administration</h1>
          <p className="text-sm text-slate-500 mt-0.5">Campus Health Kiosk — System Management</p>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center ${
                activeTab === id
                  ? 'bg-white text-brand-700 shadow-jira'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {TAB_CONTENT[activeTab]}
      </div>
    </div>
  );
};

export default AdminDashboard;