import React, { useState, useEffect } from 'react';
import { Search, X, User, FileText, Receipt, ArrowRight, Hash } from 'lucide-react';
import { searchApi } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ clients: any[]; tasks: any[]; invoices: any[] }>({
    clients: [],
    tasks: [],
    invoices: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ clients: [], tasks: [], invoices: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchApi.globalSearch(query);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <Search className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients by Name, PAN, GSTIN, Code, Tasks, or Invoices (Press ESC to close)..."
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-sm font-medium"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="ml-2 px-2 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 divide-y divide-slate-100 dark:divide-slate-700">
          {loading && <div className="py-8 text-center text-sm text-slate-500">Searching CAOS enterprise engine...</div>}

          {!loading && !query && (
            <div className="py-8 text-center text-sm text-slate-400">
              Type any Client Name, PAN Number (e.g. AABCS1234C), GSTIN, Client Code, Task or Invoice #
            </div>
          )}

          {!loading && query && results.clients.length === 0 && results.tasks.length === 0 && results.invoices.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">No matching records found for "{query}".</div>
          )}

          {/* Clients Section */}
          {!loading && results.clients.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Clients ({results.clients.length})
              </div>
              <div className="space-y-1.5">
                {results.clients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      navigate(`/clients/${c.id}`);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-indigo-50/60 dark:hover:bg-slate-700/50 cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {c.name}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded font-semibold">
                          {c.clientCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                        {c.panNumber && <span>PAN: {c.panNumber}</span>}
                        {c.gstin && <span>GSTIN: {c.gstin}</span>}
                        {c.mobile && <span>Ph: {c.mobile}</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Section */}
          {!loading && results.tasks.length > 0 && (
            <div className="pt-3">
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Tasks ({results.tasks.length})
              </div>
              <div className="space-y-1.5">
                {results.tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      navigate('/kanban');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/60 dark:hover:bg-slate-700/50 cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.title}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {t.status}
                        </span>
                        {t.dueDate && <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Section */}
          {!loading && results.invoices.length > 0 && (
            <div className="pt-3">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" /> Invoices ({results.invoices.length})
              </div>
              <div className="space-y-1.5">
                {results.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      navigate('/revenue');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-emerald-50/60 dark:hover:bg-slate-700/50 cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{inv.invoiceNumber}</span>
                        <span className="text-xs text-slate-500 font-medium">{inv.client?.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Fee: ₹{inv.clientFee?.toLocaleString()} | Status: {inv.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
