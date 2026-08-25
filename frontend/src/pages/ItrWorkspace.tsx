import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, Clock, AlertTriangle, Filter, Search, Edit3, ShieldAlert, Plus, Upload, Download, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { itrApi, clientApi } from '../lib/api';
import { ItrReturn, Client } from '../types';
import toast from 'react-hot-toast';

export default function ItrWorkspace() {
  const [returns, setReturns] = useState<ItrReturn[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [kpis, setKpis] = useState({
    totalItrClients: 0,
    pendingCount: 0,
    inProgressCount: 0,
    filedCount: 0,
    verifiedCount: 0,
    noticeCount: 0,
    refundPendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ayFilter, setAyFilter] = useState('AY 2025-26');
  const [statusFilter, setStatusFilter] = useState('');

  // Add ITR Filing Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFiling, setNewFiling] = useState({
    clientId: '',
    assessmentYear: 'AY 2025-26',
    filingStatus: 'PENDING',
    refundStatus: 'N_A',
    refundAmount: 0,
    noticeStatus: 'NO_NOTICE',
    acknowledgementNo: '',
    notes: '',
  });

  // Bulk Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);

  // Status Update Modal State
  const [selectedReturn, setSelectedReturn] = useState<ItrReturn | null>(null);
  const [filingStatus, setFilingStatus] = useState<string>('FILED');
  const [refundStatus, setRefundStatus] = useState<string>('N_A');
  const [noticeStatus, setNoticeStatus] = useState<string>('NO_NOTICE');
  const [ackNo, setAckNo] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchItrData();
    clientApi.list().then((res) => setClientsList(res.clients)).catch(() => {});
  }, [search, ayFilter, statusFilter]);

  const fetchItrData = async () => {
    try {
      setLoading(true);
      const data = await itrApi.getWorkspace({ search, assessmentYear: ayFilter, status: statusFilter });
      setReturns(data.returns);
      setKpis(data.kpis);
    } catch (err) {
      toast.error('Failed to load ITR workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFiling.clientId) {
      toast.error('Please select a client');
      return;
    }
    try {
      await itrApi.createReturn(newFiling);
      toast.success('ITR filing record created');
      setShowAddModal(false);
      fetchItrData();
    } catch (err) {
      toast.error('Failed to create ITR filing record');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    try {
      setUpdating(true);
      await itrApi.updateStatus(selectedReturn.id, {
        filingStatus,
        refundStatus,
        noticeStatus,
        acknowledgementNo: ackNo,
      });
      toast.success('ITR filing record updated');
      setSelectedReturn(null);
      fetchItrData();
    } catch (err) {
      toast.error('Failed to update ITR record');
    } finally {
      setUpdating(false);
    }
  };

  // Download ITR Import Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Client Code': 'CAOS-000001',
        PAN: 'ABCDE1234F',
        'Assessment Year': 'AY 2025-26',
        'Filing Status': 'FILED',
        'Refund Status': 'PROCESSED',
        'Refund Amount': 15000,
        'Notice Status': 'NO_NOTICE',
        'Ack Number': 'ITR-77889920261',
        Remarks: 'e-Verified successfully',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ItrImportTemplate');
    XLSX.writeFile(wb, 'CAOS_ITR_Import_Template.xlsx');
    toast.success('Downloaded ITR import template');
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
        toast.success(`Parsed ${parsedData.length} ITR rows from Excel`);
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
      const res = await itrApi.import(importRows);
      setImportReport(res.results);
      toast.success(res.message);
      fetchItrData();
    } catch (err) {
      toast.error('Failed to execute ITR bulk import');
    } finally {
      setImporting(false);
    }
  };

  // Export ITR Returns to Excel
  const handleExportItr = async () => {
    try {
      const data = await itrApi.export();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ItrFilings');
      XLSX.writeFile(wb, `CAOS_ITR_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${data.length} ITR filing records`);
    } catch (err) {
      toast.error('Failed to export ITR filings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-indigo-600" /> ITR Management Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ITR-1 to ITR-7 Forms, e-Verification, Refund Tracker & Notice Monitor
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" /> Add ITR Filing
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
            onClick={handleExportItr}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Export (.xlsx)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">ITR Clients</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{kpis.totalItrClients}</p>
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
            <CheckCircle2 className="w-3.5 h-3.5" /> Filed & Verified
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{kpis.filedCount + kpis.verifiedCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-rose-500 uppercase flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Notices Issued
          </p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{kpis.noticeCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-indigo-500 uppercase">Refund Pending</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">{kpis.refundPendingCount}</p>
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
            placeholder="Search by Client Name or PAN..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={ayFilter}
            onChange={(e) => setAyFilter(e.target.value)}
            className="text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2"
          >
            <option value="AY 2025-26">AY 2025-26</option>
            <option value="AY 2024-25">AY 2024-25</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Filing Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="DOCUMENTS_AWAITED">Documents Awaited</option>
            <option value="READY_FOR_FILING">Ready For Filing</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FILED">Filed</option>
            <option value="VERIFIED">Verified</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* ITR Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Client Name & Code</th>
                <th className="p-4">PAN Number</th>
                <th className="p-4">AY</th>
                <th className="p-4">Filing Status</th>
                <th className="p-4">Refund Status</th>
                <th className="p-4">Notice Status</th>
                <th className="p-4">Ack / ITR-V #</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Loading ITR workspace matrix...</td>
                </tr>
              ) : returns.length > 0 ? (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{r.client?.name}</p>
                      <p className="font-mono text-[10px] text-indigo-600">{r.client?.clientCode}</p>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">{r.client?.panNumber || '—'}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{r.assessmentYear}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        r.filingStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        r.filingStatus === 'READY_FOR_FILING' ? 'bg-indigo-100 text-indigo-700' :
                        r.filingStatus === 'DOCUMENTS_AWAITED' ? 'bg-orange-100 text-orange-700' :
                        r.filingStatus === 'FILED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {r.filingStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-400">{r.refundStatus}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        r.noticeStatus === 'NOTICE_ISSUED' ? 'bg-rose-100 text-rose-700' : 'text-slate-400'
                      }`}>
                        {r.noticeStatus}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{r.acknowledgementNo || '—'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedReturn(r);
                          setFilingStatus(r.filingStatus);
                          setRefundStatus(r.refundStatus);
                          setNoticeStatus(r.noticeStatus);
                          setAckNo(r.acknowledgementNo || '');
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg flex items-center gap-1 ml-auto"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">No ITR records in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add ITR Filing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add ITR Filing Record</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateFiling} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Client *</label>
                <select
                  value={newFiling.clientId}
                  onChange={(e) => setNewFiling({ ...newFiling, clientId: e.target.value })}
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
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Assessment Year</label>
                  <input
                    type="text"
                    value={newFiling.assessmentYear}
                    onChange={(e) => setNewFiling({ ...newFiling, assessmentYear: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Filing Status</label>
                  <select
                    value={newFiling.filingStatus}
                    onChange={(e) => setNewFiling({ ...newFiling, filingStatus: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="DOCUMENTS_AWAITED">DOCUMENTS AWAITED</option>
                    <option value="READY_FOR_FILING">READY FOR FILING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="FILED">FILED</option>
                    <option value="VERIFIED">VERIFIED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  Save Filing Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import ITR Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Bulk Import ITR Filings (.xlsx)
              </h3>
              <button onClick={() => setShowImportModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">ITR Import Template</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Download pre-formatted Excel template for ITR filings</p>
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
                  ✓ Ready to import {importRows.length} ITR filing records.
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
                  {importing ? 'Importing...' : 'Upload & Process ITR Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit ITR Status Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update ITR Record — {selectedReturn.client?.name}
            </h3>

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Filing Status</label>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="DOCUMENTS_AWAITED">DOCUMENTS AWAITED</option>
                  <option value="READY_FOR_FILING">READY FOR FILING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="FILED">FILED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">ITR-V / Ack Number</label>
                <input
                  type="text"
                  value={ackNo}
                  onChange={(e) => setAckNo(e.target.value)}
                  placeholder="e.g. ITR-77889920261"
                  className="w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelectedReturn(null)} className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  {updating ? 'Saving...' : 'Save ITR Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
