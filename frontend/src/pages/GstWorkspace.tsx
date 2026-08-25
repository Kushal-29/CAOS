import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckCircle2, Clock, AlertTriangle, Filter, Search, Edit3, Zap, Plus, Upload, Download, X, Eye, EyeOff, Key, Copy, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { gstApi, clientApi, credentialApi } from '../lib/api';
import { GstReturn, Client } from '../types';
import toast from 'react-hot-toast';

export default function GstWorkspace() {
  const [returns, setReturns] = useState<GstReturn[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [kpis, setKpis] = useState({
    totalGstClients: 0,
    pendingCount: 0,
    inProgressCount: 0,
    filedCount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [autoGenerating, setAutoGenerating] = useState(false);

  // Portal Secrets Reveal State (Keyed by credentialId or returnId)
  const [revealedSecrets, setRevealedSecrets] = useState<{ [key: string]: string }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add GST Return Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReturn, setNewReturn] = useState({
    clientId: '',
    period: 'Feb 2026',
    returnType: 'GSTR1',
    dueDate: '2026-03-11',
    lateFee: 0,
    notes: '',
  });

  // Bulk Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);

  // Update Status Modal State
  const [selectedReturn, setSelectedReturn] = useState<GstReturn | null>(null);
  const [newStatus, setNewStatus] = useState<string>('FILED');
  const [ackNumber, setAckNumber] = useState('');
  const [lateFee, setLateFee] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchGstData();
    clientApi.list().then((res) => setClientsList(res.clients)).catch(() => {});
  }, [search, statusFilter]);

  const fetchGstData = async () => {
    try {
      setLoading(true);
      const data = await gstApi.getWorkspace({ search, status: statusFilter });
      setReturns(data.returns);
      setKpis(data.kpis);
    } catch (err) {
      toast.error('Failed to load GST workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealSecret = async (credId: string) => {
    if (revealedSecrets[credId]) {
      setRevealedSecrets((prev) => {
        const copy = { ...prev };
        delete copy[credId];
        return copy;
      });
      return;
    }
    try {
      const secret = await credentialApi.reveal(credId);
      setRevealedSecrets((prev) => ({ ...prev, [credId]: secret }));
      toast.success('GST Portal Password decrypted');
    } catch (err) {
      toast.error('Failed to decrypt portal credential');
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturn.clientId) {
      toast.error('Please select a client');
      return;
    }
    try {
      await gstApi.createReturn(newReturn);
      toast.success('GST return record created');
      setShowAddModal(false);
      fetchGstData();
    } catch (err) {
      toast.error('Failed to create GST return record');
    }
  };

  const handleAutoGenerate = async () => {
    try {
      setAutoGenerating(true);
      const res = await gstApi.autoGenerate('Feb 2026');
      toast.success(res.message || 'Auto-generated monthly GST return records');
      fetchGstData();
    } catch (err) {
      toast.error('Failed to auto-generate monthly returns');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    try {
      setUpdating(true);
      await gstApi.updateStatus(selectedReturn.id, {
        status: newStatus,
        ackNumber,
        lateFee,
      });
      toast.success('GST return status updated successfully');
      setSelectedReturn(null);
      fetchGstData();
    } catch (err) {
      toast.error('Failed to update GST return');
    } finally {
      setUpdating(false);
    }
  };

  // Download GST Import Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Client Code': 'CAOS-000001',
        GSTIN: '07ABCDE1234F1Z5',
        Period: 'Feb 2026',
        'Return Type': 'GSTR1',
        Status: 'FILED',
        'Ack Number': 'ARN-88990011',
        'Late Fee': 0,
        Remarks: 'Filed before due date',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GstImportTemplate');
    XLSX.writeFile(wb, 'CAOS_GST_Import_Template.xlsx');
    toast.success('Downloaded GST import template');
  };

  // Parse Uploaded Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const parsedData = XLSX.utils.sheet_to_json(ws);
        setImportRows(parsedData);
        toast.success(`Parsed ${parsedData.length} GST rows from Excel`);
      } catch (err) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImportSubmit = async () => {
    if (importRows.length === 0) return;
    try {
      setImporting(true);
      const res = await gstApi.import(importRows);
      setImportReport(res.results);
      toast.success(res.message);
      fetchGstData();
    } catch (err) {
      toast.error('Failed to execute GST bulk import');
    } finally {
      setImporting(false);
    }
  };

  // Export GST Returns to Excel
  const handleExportGst = async () => {
    try {
      const data = await gstApi.export();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'GstFilings');
      XLSX.writeFile(wb, `CAOS_GST_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${data.length} GST filing records`);
    } catch (err) {
      toast.error('Failed to export GST filings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" /> GST Management Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            GSTR-1, GSTR-3B, CMP08 & Annual Return (GSTR-9) Filing Operations Center
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" /> Add GST Return
          </button>
          <button
            onClick={() => {
              setShowImportModal(true);
              setImportRows([]);
              setImportReport(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition-colors"
          >
            <Upload className="w-4 h-4" /> Bulk Import
          </button>
          <button
            onClick={handleExportGst}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Export (.xlsx)
          </button>
          <button
            onClick={handleAutoGenerate}
            disabled={autoGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow transition-colors"
          >
            <Zap className="w-4 h-4" /> {autoGenerating ? 'Generating...' : 'Auto-Generate'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">GST Clients</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{kpis.totalGstClients}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-amber-500 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending
          </p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{kpis.pendingCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-blue-500 uppercase">In Progress</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{kpis.inProgressCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-emerald-500 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Filed
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{kpis.filedCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-rose-500 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue
          </p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{kpis.overdueCount}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, GSTIN, Portal Username..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FILED">Filed</option>
            <option value="LATE_FILED">Late Filed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Client Name & Code</th>
                <th className="p-4">GST Portal Login</th>
                <th className="p-4">GSTIN</th>
                <th className="p-4">Period</th>
                <th className="p-4">Return Type</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ack Number</th>
                <th className="p-4">Late Fee</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">Loading GST returns matrix...</td>
                </tr>
              ) : returns.length > 0 ? (
                returns.map((r) => {
                  const cred = r.client?.credentials?.[0];
                  const username = r.client?.gstUsername || cred?.portalUsername || '—';
                  const credId = cred?.id;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">{r.client?.name}</p>
                        <p className="font-mono text-[10px] text-indigo-600">{r.client?.clientCode}</p>
                      </td>

                      {/* GST Portal Login Credentials with Eye Reveal */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{username}</span>
                            {username !== '—' && (
                              <button
                                onClick={() => handleCopyText(username, `user-${r.id}`)}
                                className="text-slate-400 hover:text-indigo-600 p-0.5"
                                title="Copy Username"
                              >
                                {copiedId === `user-${r.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Key className="w-3 h-3 text-slate-400" />
                            <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                              {credId && revealedSecrets[credId] ? revealedSecrets[credId] : '••••••••••••'}
                            </span>
                            {credId && (
                              <button
                                onClick={() => handleRevealSecret(credId)}
                                className="p-0.5 text-slate-400 hover:text-indigo-600"
                                title="Toggle Password Visibility"
                              >
                                {revealedSecrets[credId] ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5 text-indigo-500" />}
                              </button>
                            )}
                            {credId && revealedSecrets[credId] && (
                              <button
                                onClick={() => handleCopyText(revealedSecrets[credId], `pass-${r.id}`)}
                                className="text-slate-400 hover:text-indigo-600 p-0.5"
                                title="Copy Password"
                              >
                                {copiedId === `pass-${r.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-semibold text-slate-700 dark:text-slate-300">{r.client?.gstin || '—'}</td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{r.period}</td>
                      <td className="p-4 font-mono font-bold text-indigo-600">{r.returnType}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{new Date(r.dueDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                          r.status === 'FILED' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'LATE_FILED' ? 'bg-orange-100 text-orange-700' :
                          r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          r.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{r.ackNumber || '—'}</td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">₹{r.notes ? (r.notes.match(/\d+/) || [0])[0] : 0}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedReturn(r);
                            setNewStatus(r.status);
                            setAckNumber(r.ackNumber || '');
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg flex items-center gap-1 ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Update
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">No GST return records in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add GST Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add GST Return Record</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Client *</label>
                <select
                  value={newReturn.clientId}
                  onChange={(e) => setNewReturn({ ...newReturn, clientId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required
                >
                  <option value="">Select Client</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Period</label>
                  <input
                    type="text"
                    value={newReturn.period}
                    onChange={(e) => setNewReturn({ ...newReturn, period: e.target.value })}
                    placeholder="e.g. Feb 2026"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Return Type</label>
                  <select
                    value={newReturn.returnType}
                    onChange={(e) => setNewReturn({ ...newReturn, returnType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="GSTR1">GSTR1</option>
                    <option value="GSTR3B">GSTR3B</option>
                    <option value="CMP08">CMP08</option>
                    <option value="GSTR9">GSTR9</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  Save Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import GST Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Bulk Import GST Filings (.xlsx)
              </h3>
              <button onClick={() => setShowImportModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">GST Import Template</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Download pre-formatted Excel template for GST filings</p>
                </div>
                <button onClick={handleDownloadTemplate} className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100">
                  Download Template
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Excel (.xlsx) File</label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              {importRows.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
                  ✓ Ready to import {importRows.length} GST filing records.
                </div>
              )}

              {importReport && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-slate-900 dark:text-white">Import Execution Summary</p>
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="text-emerald-600">Success: {importReport.success}</span>
                    <span className="text-rose-600">Failed: {importReport.failed}</span>
                  </div>
                  {importReport.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto text-[10px] text-rose-500 font-mono space-y-0.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                      {importReport.errors.map((err: string, idx: number) => (
                        <p key={idx}>{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleBulkImportSubmit}
                  disabled={importing || importRows.length === 0}
                  className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  {importing ? 'Importing...' : 'Upload & Process GST Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit GST Status Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update GST Return — {selectedReturn.client?.name}
            </h3>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Filing Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="FILED">FILED</option>
                  <option value="LATE_FILED">LATE_FILED</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">ARN Number</label>
                <input
                  type="text"
                  value={ackNumber}
                  onChange={(e) => setAckNumber(e.target.value)}
                  placeholder="e.g. ARN-88990011"
                  className="w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelectedReturn(null)} className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  {updating ? 'Saving...' : 'Save Return Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
