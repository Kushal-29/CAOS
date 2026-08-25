import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, Plus, Lock, Search, Filter, History } from 'lucide-react';
import { credentialApi, clientApi } from '../lib/api';
import { CredentialItem, Client } from '../types';
import toast from 'react-hot-toast';

const PORTALS = ['ALL', 'GST', 'INCOME_TAX', 'MCA', 'TRACES', 'OTHER'];

export default function Credentials() {
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState('ALL');
  const [search, setSearch] = useState('');
  const [revealedSecrets, setRevealedSecrets] = useState<{ [key: string]: string }>({});

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [type, setType] = useState('INCOME_TAX');
  const [portalUsername, setPortalUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, [selectedPortal, search]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const data = await credentialApi.list({
        type: selectedPortal === 'ALL' ? undefined : selectedPortal,
        search,
      });
      setCredentials(data);
    } catch (err) {
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async (id: string) => {
    if (revealedSecrets[id]) {
      setRevealedSecrets((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      return;
    }
    try {
      const secretVal = await credentialApi.reveal(id);
      setRevealedSecrets((prev) => ({ ...prev, [id]: secretVal }));
      toast.success('AES-256 password decrypted & logged');
    } catch (err) {
      toast.error('Failed to reveal password');
    }
  };

  const handleOpenCreateModal = async () => {
    try {
      const data = await clientApi.list({ pageSize: 100 });
      setClientsList(data.clients);
      if (data.clients.length > 0) setSelectedClientId(data.clients[0].id);
      setShowCreateModal(true);
    } catch (err) {
      toast.error('Failed to load client roster');
    }
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !portalUsername.trim() || !secret.trim()) return;
    try {
      setSubmitting(true);
      await credentialApi.create({
        clientId: selectedClientId,
        type,
        portalUsername,
        secret,
      });
      toast.success('Credential encrypted and saved to vault');
      setShowCreateModal(false);
      setPortalUsername('');
      setSecret('');
      fetchCredentials();
    } catch (err) {
      toast.error('Failed to save credential');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-600" /> Enterprise Credential Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            AES-256-GCM Encrypted Storage for Income Tax, GST, MCA & TRACES Portals
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Credential
        </button>
      </div>

      {/* Security Alert Banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Enterprise Audit Enforcement:</strong> All passwords stored here are symmetrically encrypted using AES-256-GCM. 
          Every single "Reveal" action is written to the immutable <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">CredentialAccessLog</code> audit trail with your user ID and IP address.
        </p>
      </div>

      {/* Portal Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1">
        {PORTALS.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPortal(p)}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors ${
              selectedPortal === p
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {p.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name or username..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Loading vault credentials...</div>
        ) : credentials.length > 0 ? (
          credentials.map((cred) => (
            <div
              key={cred.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 hover:border-indigo-500 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {cred.type}
                  </span>
                  <span className="text-[10px] text-slate-400">Updated: {new Date(cred.updatedAt).toLocaleDateString()}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{cred.client?.name}</h4>
                  <p className="font-mono text-[10px] text-indigo-600">{cred.client?.clientCode}</p>
                </div>

                <div className="space-y-1 text-xs bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400">Username:</span>{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{cred.portalUsername}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {revealedSecrets[cred.id] || '••••••••••••'}
                      </span>
                      <button
                        onClick={() => handleReveal(cred.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                        title="Toggle visibility"
                      >
                        {revealedSecrets[cred.id] ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-400">
                <span>Viewed By: {cred.lastViewedBy?.name || 'Staff'}</span>
                <span>Updated By: {cred.lastUpdatedBy?.name || 'Admin'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            No credentials found for "{selectedPortal}".
          </div>
        )}
      </div>

      {/* Add Credential Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Store New Portal Credential</h3>

            <form onSubmit={handleCreateCredential} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Portal Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="INCOME_TAX">Income Tax Portal</option>
                  <option value="GST">GST Portal</option>
                  <option value="MCA">MCA (Ministry of Corporate Affairs)</option>
                  <option value="TRACES">TRACES Portal</option>
                  <option value="OTHER">Other Portal</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Portal Username / User ID</label>
                <input
                  type="text"
                  value={portalUsername}
                  onChange={(e) => setPortalUsername(e.target.value)}
                  placeholder="e.g. AABCS1234C"
                  className="w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Password (will be AES-256 encrypted)</label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {submitting ? 'Encrypting...' : 'Save & Encrypt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
