import React, { useState, useEffect } from 'react';
import { BellRing, CheckCircle2, Clock, Plus, Search, Filter, PhoneCall, AlertCircle } from 'lucide-react';
import { followupApi, clientApi } from '../lib/api';
import { FollowUpItem, Client } from '../types';
import toast from 'react-hot-toast';

export default function FollowUps() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [kpis, setKpis] = useState({ openCount: 0, resolvedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [category, setCategory] = useState<any>('DOCUMENTS');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFollowUps();
  }, [categoryFilter, statusFilter]);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const data = await followupApi.list({ category: categoryFilter, status: statusFilter });
      setFollowUps(data.followUps);
      setKpis(data.kpis);
    } catch (err) {
      toast.error('Failed to load follow-up items');
    } finally {
      setLoading(false);
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

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !title.trim() || !dueDate) return;
    try {
      setSubmitting(true);
      await followupApi.create({
        clientId: selectedClientId,
        category,
        title,
        notes,
        dueDate,
      });
      toast.success('Follow-up item created');
      setShowCreateModal(false);
      setTitle('');
      setNotes('');
      fetchFollowUps();
    } catch (err) {
      toast.error('Failed to create follow-up item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await followupApi.updateStatus(id, { status: 'RESOLVED' });
      toast.success('Follow-up marked as RESOLVED');
      fetchFollowUps();
    } catch (err) {
      toast.error('Failed to resolve follow-up');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BellRing className="w-7 h-7 text-indigo-600" /> Practice Follow-up Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Client Document Requests, GST/ITR Pending Reminders & Fee Follow-ups
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Follow-up
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase">Open Follow-ups</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{kpis.openCount}</p>
          </div>
          <AlertCircle className="w-8 h-8 text-amber-400/60" />
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-500 uppercase">Resolved Items</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{kpis.resolvedCount}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200"
          >
            <option value="OPEN">Open Follow-ups</option>
            <option value="RESOLVED">Resolved Follow-ups</option>
            <option value="">All Statuses</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Categories</option>
            <option value="DOCUMENTS">Documents Pending</option>
            <option value="GST">GST Pending</option>
            <option value="ITR">ITR Pending</option>
            <option value="PAYMENT">Payment Follow-up</option>
            <option value="AUDIT">Audit Follow-up</option>
          </select>
        </div>
      </div>

      {/* Follow-up Items Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs">Loading follow-ups...</div>
        ) : followUps.length > 0 ? (
          followUps.map((f) => (
            <div
              key={f.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                    {f.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{f.title}</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Client: <span className="font-semibold text-slate-800 dark:text-slate-200">{f.client?.name}</span> ({f.client?.clientCode}) • Mobile: {f.client?.mobile}
                </p>
                {f.notes && <p className="text-xs italic text-slate-400 mt-1">{f.notes}</p>}
              </div>

              <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-700">
                <div className="text-right text-xs">
                  <p className="text-slate-400 font-medium">Due Date</p>
                  <p className="font-bold text-amber-600">{new Date(f.dueDate).toLocaleDateString()}</p>
                </div>

                {f.status === 'OPEN' && (
                  <button
                    onClick={() => handleResolve(f.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs">
            No follow-up items recorded.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Follow-up Item</h3>
            <form onSubmit={handleCreateFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Client</label>
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
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="DOCUMENTS">Documents Pending</option>
                  <option value="GST">GST Pending</option>
                  <option value="ITR">ITR Pending</option>
                  <option value="PAYMENT">Payment Follow-up</option>
                  <option value="AUDIT">Audit Follow-up</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Follow-up Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Collect Jan Purchase Register"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Notes / Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add specific instructions..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
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
                  {submitting ? 'Creating...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
