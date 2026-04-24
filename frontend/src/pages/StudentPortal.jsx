import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, RefreshCw, Package, Clock } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import ScrollToTopButton from '../components/common/ScrollToTopButton';
import ProductCard from '../components/student/ProductCard';
import TokenModal from '../components/student/TokenModal';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const StudentPortal = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [myTokens, setMyTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);
  const [activeToken, setActiveToken] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const navLinks = [
    { label: 'Catalog', to: '/portal', active: location.pathname === '/portal' },
    { label: 'My Tokens', to: '/portal/tokens', active: location.pathname === '/portal/tokens' },
  ];

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodRes, tokRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/tokens/my'),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data.products);
      setMyTokens(tokRes.data.tokens.filter((t) => t.tokenStatus === 'Issued'));
      setCategories(['All', ...catRes.data.categories.map(c => c.name)]);
    } catch {
      toast.error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  const activeTokenProductIds = useMemo(
    () => new Set(myTokens.map((t) => t.product?._id)),
    [myTokens]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'All' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  const handleRequest = async (product) => {
    setRequestingId(product._id);
    try {
      const { data } = await api.post('/tokens/request', { productId: product._id });
      setActiveToken(data.token);
      setMyTokens((prev) => [...prev, data.token]);
      toast.success('Token issued! Show the QR code at the kiosk.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Token request failed');
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar links={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Welcome bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="page-title">Health Product Catalog</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Welcome, <span className="font-medium text-slate-700">{user?.name}</span> · {user?.campusId}
            </p>
          </div>
          <button onClick={fetchAll} disabled={loading} className="btn-secondary flex items-center gap-2 self-start sm:self-auto">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Active tokens notice */}
        {myTokens.length > 0 && (
          <div className="flex items-center gap-2.5 p-3 bg-brand-50 border border-brand-200 rounded-lg mb-5">
            <Clock size={15} className="text-brand-700 flex-shrink-0" />
            <p className="text-sm text-brand-800">
              You have <strong>{myTokens.length}</strong> active token{myTokens.length > 1 ? 's' : ''}.{' '}
              <button onClick={() => navigate('/portal/tokens')} className="underline font-medium">View them here.</button>
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="input pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-slate-400 flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  category === cat
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400 hover:text-brand-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-52 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package size={40} className="text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No products found</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }} className="btn-secondary text-xs">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onRequest={handleRequest}
                requesting={requestingId === product._id}
                hasActiveToken={activeTokenProductIds.has(product._id)}
              />
            ))}
          </div>
        )}

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-slate-400 mt-4 text-center">
            Showing {filtered.length} of {products.length} products
          </p>
        )}
      </main>

      <ScrollToTopButton />

      {/* Token modal */}
      {activeToken && <TokenModal token={activeToken} onClose={() => setActiveToken(null)} />}
    </div>
  );
};

export default StudentPortal;