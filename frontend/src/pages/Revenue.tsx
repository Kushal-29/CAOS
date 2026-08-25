import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, DollarSign, Receipt, CreditCard, Search } from 'lucide-react';
import { revenueApi, clientApi } from '../lib/api';
import { InvoiceItem, Client } from '../types';
import toast from 'react-hot-toast';

export default function Revenue() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    collectedRevenue: 0,
    outstandingRevenue: 0,
    totalInvoicesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [serviceType, setServiceType] = useState('ITR_FILING');
  const [clientFee, setClientFee] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Record Payment Modal State
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceItem | null>(null);
  const [additionalPayment, setAdditionalPayment] = useState('');

  useEffect(() => {
    fetchRevenueData();
  }, [search]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const data = await revenueApi.getData({ search });
      setInvoices(data.invoices);
      setKpis(data.kpis);
    } catch (err) {
      toast.error('Failed to load revenue data');
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

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !clientFee || !dueDate) return;
    try {
      setSubmitting(true);
      await revenueApi.createInvoice({
        clientId: selectedClientId,
        serviceType,
        clientFee,
        paidAmount,
        dueDate,
        notes,
      });
      toast.success('Invoice generated successfully');
      setShowCreateModal(false);
      setClientFee('');
      setPaidAmount('');
      fetchRevenueData();
    } catch (err) {
      toast.error('Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || !additionalPayment) return;
    try {
      await revenueApi.recordPayment(paymentInvoice.id, parseFloat(additionalPayment));
      toast.success('Payment recorded successfully');
      setPaymentInvoice(null);
      setAdditionalPayment('');
      fetchRevenueData();
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-indigo-600" /> Revenue & Billing Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Client Fee Schedule, Invoicing, Outstanding Collections & Payment Records
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Firm Revenue</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            ₹{kpis.totalRevenue?.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">{kpis.totalInvoicesCount} invoices generated</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> Collected Revenue
          </p>
          <p className="text-3xl font-extrabold text-emerald-600">
            ₹{kpis.collectedRevenue?.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600/80 font-medium">Successfully received</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowDownRight className="w-4 h-4" /> Outstanding Revenue
          </p>
          <p className="text-3xl font-extrabold text-rose-600">
            ₹{kpis.outstandingRevenue?.toLocaleString()}
          </p>
          <p className="text-[11px] text-rose-600/80 font-medium">Pending client collection</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice # or client name..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Client Name</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Client Fee</th>
                <th className="p-4">Paid Amount</th>
                <th className="p-4">Pending</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {inv.client?.name} <span className="font-mono text-[10px] text-slate-400">({inv.client?.clientCode})</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{inv.serviceType}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">₹{inv.clientFee?.toLocaleString()}</td>
                    <td className="p-4 font-semibold text-emerald-600">₹{inv.paidAmount?.toLocaleString()}</td>
                    <td className="p-4 font-semibold text-rose-600">₹{inv.pendingAmount?.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {inv.pendingAmount > 0 && (
                        <button
                          onClick={() => setPaymentInvoice(inv)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg flex items-center gap-1 ml-auto"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">No invoice records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate Client Invoice</h3>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
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
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="ITR_FILING">ITR Filing</option>
                  <option value="GST_FILING">GST Filing</option>
                  <option value="AUDIT">Tax Audit & Statutory Audit</option>
                  <option value="BOOKKEEPING">Accounting & Bookkeeping</option>
                  <option value="CONSULTATION">Tax Advisory / Consultation</option>
                  <option value="ROC_COMPLIANCE">ROC & Corporate Compliance</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Total Agreed Fee (₹)</label>
                <input
                  type="number"
                  value={clientFee}
                  onChange={(e) => setClientFee(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Paid Amount Upfront (₹)</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                  {submitting ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Record Payment — {paymentInvoice.invoiceNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Client: <span className="font-bold text-slate-800 dark:text-slate-200">{paymentInvoice.client?.name}</span> • Pending Fee: <span className="font-bold text-rose-600">₹{paymentInvoice.pendingAmount?.toLocaleString()}</span>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Additional Payment Received (₹)</label>
                <input
                  type="number"
                  value={additionalPayment}
                  onChange={(e) => setAdditionalPayment(e.target.value)}
                  placeholder={`Max ₹${paymentInvoice.pendingAmount}`}
                  className="w-full p-2.5 font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
