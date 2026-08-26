import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Search,
  Edit3,
  Trash2,
  Plus,
  Upload,
  Download,
  X,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Copy,
  Check,
  IndianRupee,
  Key,
  User,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { itrApi, clientApi } from '../lib/api';
import { ItrReturn, Client as ClientType } from '../types';
import toast from 'react-hot-toast';

export default function ItrWorkspace() {
  const [returns, setReturns] = useState<ItrReturn[]>([]);
  const [clientsList, setClientsList] = useState<ClientType[]>([]);
  const [kpis, setKpis] = useState({
    totalCount: 0,
    puneethCount: 0,
    anilCount: 0,
    receivedCount: 0,
    notReceivedCount: 0,
    totalPrice: 0,
    totalReceivedPrice: 0,
    totalPendingPrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedTab, setAssignedTab] = useState<string>('ALL'); // 'ALL' | 'Puneeth' | 'Anil'

  // Eye reveal passwords map & copied text ID
  const [revealedPasswords, setRevealedPasswords] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add ITR Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    clientId: '',
    name: '',
    panNumber: '',
    password: '',
    price: '',
    isReceived: false,
    assignedTo: 'Puneeth',
  });

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);

  // Edit Record Modal State
  const [selectedReturn, setSelectedReturn] = useState<ItrReturn | null>(null);
  const [editName, setEditName] = useState('');
  const [editPan, setEditPan] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editIsReceived, setEditIsReceived] = useState(false);
  const [editAssignedTo, setEditAssignedTo] = useState('Puneeth');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchItrData();
    clientApi.list().then((res) => setClientsList(res.clients || [])).catch(() => {});
  }, [search, statusFilter, assignedTab]);

  const fetchItrData = async () => {
    try {
      setLoading(true);
      const data = await itrApi.getWorkspace({
        search,
        status: statusFilter,
        assignedTo: assignedTab === 'ALL' ? undefined : assignedTab,
      });
      setReturns(data.returns || []);
      setKpis(data.kpis || {
        totalCount: 0,
        puneethCount: 0,
        anilCount: 0,
        receivedCount: 0,
        notReceivedCount: 0,
        totalPrice: 0,
        totalReceivedPrice: 0,
        totalPendingPrice: 0,
      });
    } catch (err) {
      toast.error('Failed to load ITR data');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleReceived = async (r: ItrReturn) => {
    const nextStatus = !r.isReceived;
    try {
      setReturns((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, isReceived: nextStatus } : item))
      );
      await itrApi.updateStatus(r.id, { isReceived: nextStatus });
      toast.success(`Marked as ${nextStatus ? 'Received' : 'Not Received'}`);
      fetchItrData();
    } catch (err) {
      toast.error('Failed to update payment status');
      fetchItrData();
    }
  };

  const handleQuickReassign = async (r: ItrReturn, newAssignedTo: string) => {
    try {
      setReturns((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, assignedTo: newAssignedTo } : item))
      );
      await itrApi.updateStatus(r.id, { assignedTo: newAssignedTo });
      toast.success(`Assigned to ${newAssignedTo}`);
      fetchItrData();
    } catch (err) {
      toast.error('Failed to reassign client');
      fetchItrData();
    }
  };

  const handleCreateFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.clientId && !newRecord.name) {
      toast.error('Please enter Client Name or select an existing client');
      return;
    }
    try {
      await itrApi.createReturn({
        clientId: newRecord.clientId || undefined,
        name: newRecord.name,
        panNumber: newRecord.panNumber,
        password: newRecord.password,
        price: parseFloat(newRecord.price || '0'),
        isReceived: newRecord.isReceived,
        assignedTo: newRecord.assignedTo,
      });
      toast.success('ITR record created successfully');
      setShowAddModal(false);
      setNewRecord({
        clientId: '',
        name: '',
        panNumber: '',
        password: '',
        price: '',
        isReceived: false,
        assignedTo: 'Puneeth',
      });
      fetchItrData();
    } catch (err) {
      toast.error('Failed to create ITR record');
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    try {
      setUpdating(true);
      await itrApi.updateStatus(selectedReturn.id, {
        name: editName,
        panNumber: editPan,
        password: editPassword,
        price: parseFloat(editPrice || '0'),
        isReceived: editIsReceived,
        assignedTo: editAssignedTo,
      });
      toast.success('ITR record updated successfully');
      setSelectedReturn(null);
      fetchItrData();
    } catch (err) {
      toast.error('Failed to update ITR record');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ITR record?')) return;
    try {
      await itrApi.deleteReturn(id);
      toast.success('ITR record deleted');
      fetchItrData();
    } catch (err) {
      toast.error('Failed to delete ITR record');
    }
  };

  // Download ITR Excel Import Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Name': 'Rajesh Kumar',
        'PAN Number': 'ABCDE1234F',
        'Password': 'Pass@12345',
        'Price': 1500,
        'Received or Not': 'Received',
        'Assigned To': 'Puneeth',
      },
      {
        'Name': 'Suman Sharma',
        'PAN Number': 'FGHIJ5678K',
        'Password': 'Secret#987',
        'Price': 2000,
        'Received or Not': 'Not Received',
        'Assigned To': 'Anil',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ITR_Template');
    XLSX.writeFile(wb, 'ITR_Import_Template.xlsx');
    toast.success('Downloaded ITR import template');
  };

  // Parse Excel File for Import
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
        toast.success(`Parsed ${parsedData.length} rows from file`);
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
      toast.error('Failed to execute bulk import');
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
      XLSX.utils.book_append_sheet(wb, ws, 'ITR_Records');
      XLSX.writeFile(wb, `ITR_Records_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${data.length} ITR records`);
    } catch (err) {
      toast.error('Failed to export ITR records');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-indigo-600" /> ITR Management Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Separate client views for <strong>Puneeth</strong> & <strong>Anil</strong> — Name, PAN Number, Password, Price & Received Status
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setNewRecord({
                clientId: '',
                name: '',
                panNumber: '',
                password: '',
                price: '',
                isReceived: false,
                assignedTo: assignedTab === 'Anil' ? 'Anil' : 'Puneeth',
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" /> Add ITR Record
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

      {/* Puneeth vs Anil Client View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setAssignedTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            assignedTab === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> All Clients
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            assignedTab === 'ALL' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            {kpis.totalCount}
          </span>
        </button>

        <button
          onClick={() => setAssignedTab('Puneeth')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            assignedTab === 'Puneeth'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-purple-200 dark:border-purple-800'
          }`}
        >
          <User className="w-4 h-4 text-purple-500" /> Puneeth's Clients
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            assignedTab === 'Puneeth' ? 'bg-purple-500 text-white' : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
          }`}>
            {kpis.puneethCount}
          </span>
        </button>

        <button
          onClick={() => setAssignedTab('Anil')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            assignedTab === 'Anil'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
          }`}
        >
          <User className="w-4 h-4 text-blue-500" /> Anil's Clients
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            assignedTab === 'Anil' ? 'bg-blue-500 text-white' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
          }`}>
            {kpis.anilCount}
          </span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            {assignedTab === 'ALL' ? 'Total ITR Clients' : `${assignedTab}'s Clients`}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {assignedTab === 'ALL' ? kpis.totalCount : assignedTab === 'Puneeth' ? kpis.puneethCount : kpis.anilCount}
            </p>
            <span className="text-xs font-bold text-slate-500">₹{kpis.totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-emerald-500 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Received
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-extrabold text-emerald-600">{kpis.receivedCount}</p>
            <span className="text-xs font-bold text-emerald-600">₹{kpis.totalReceivedPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-amber-500 uppercase flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Not Received
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-extrabold text-amber-600">{kpis.notReceivedCount}</p>
            <span className="text-xs font-bold text-amber-600">₹{kpis.totalPendingPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-indigo-500 uppercase">Total Price Collected</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-extrabold text-indigo-600">
              ₹{kpis.totalReceivedPrice.toLocaleString()}
            </p>
            <span className="text-xs font-semibold text-slate-400">
              of ₹{kpis.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, PAN Number or Password..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Payment Statuses</option>
            <option value="RECEIVED">Received Only</option>
            <option value="NOT_RECEIVED">Not Received Only</option>
          </select>
        </div>
      </div>

      {/* Main Table — Exact Requested Fields + Partner Assignment */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Client Name</th>
                <th className="p-4">PAN Number</th>
                <th className="p-4">Password</th>
                <th className="p-4">Price</th>
                <th className="p-4">Received or Not</th>
                <th className="p-4">Assigned To</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading ITR records...
                  </td>
                </tr>
              ) : returns.length > 0 ? (
                returns.map((r) => {
                  const clientName = r.client?.name || '—';
                  const panNumber = r.client?.panNumber || '—';
                  const password = r.password || r.client?.itPasswordHash || '';
                  const isVisible = revealedPasswords[r.id];
                  const currentAssigned = r.assignedTo || 'Puneeth';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* 1. Name */}
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {clientName}
                        {r.client?.clientCode && (
                          <span className="block text-[10px] font-normal font-mono text-indigo-600 dark:text-indigo-400">
                            {r.client.clientCode}
                          </span>
                        )}
                      </td>

                      {/* 2. PAN Number */}
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {panNumber}
                      </td>

                      {/* 3. Password */}
                      <td className="p-4">
                        {password ? (
                          <div className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {isVisible ? password : '••••••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(r.id)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                              title={isVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isVisible ? (
                                <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                              )}
                            </button>
                            {isVisible && (
                              <button
                                onClick={() => handleCopyText(password, `pass-${r.id}`)}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                                title="Copy Password"
                              >
                                {copiedId === `pass-${r.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* 4. Price */}
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center">
                          <IndianRupee className="w-3 h-3 text-slate-400 mr-0.5" />
                          {(r.price || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* 5. Received or Not */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleReceived(r)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm transition-all ${
                            r.isReceived
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 hover:bg-rose-200'
                          }`}
                          title="Click to toggle Received status"
                        >
                          {r.isReceived ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Received
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Not Received
                            </>
                          )}
                        </button>
                      </td>

                      {/* Assigned To (Puneeth / Anil) */}
                      <td className="p-4">
                        <select
                          value={currentAssigned}
                          onChange={(e) => handleQuickReassign(r, e.target.value)}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border cursor-pointer focus:outline-none transition-all ${
                            currentAssigned.toLowerCase() === 'anil'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300'
                          }`}
                        >
                          <option value="Puneeth">👤 Puneeth</option>
                          <option value="Anil">👤 Anil</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReturn(r);
                              setEditName(r.client?.name || '');
                              setEditPan(r.client?.panNumber || '');
                              setEditPassword(r.password || r.client?.itPasswordHash || '');
                              setEditPrice(String(r.price || 0));
                              setEditIsReceived(Boolean(r.isReceived));
                              setEditAssignedTo(r.assignedTo || 'Puneeth');
                            }}
                            className="p-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg flex items-center gap-1"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            className="p-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 hover:bg-rose-100 rounded-lg flex items-center gap-1"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No records found for {assignedTab === 'ALL' ? 'ITR Workspace' : `${assignedTab}'s clients`}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add ITR Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New ITR Record</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreateFiling} className="space-y-3.5 text-xs">
              {/* Assign To (Puneeth / Anil) */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assigned Partner / Manager *
                </label>
                <select
                  value={newRecord.assignedTo}
                  onChange={(e) => setNewRecord({ ...newRecord, assignedTo: e.target.value })}
                  className="w-full p-2.5 font-bold bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg"
                >
                  <option value="Puneeth">👤 Puneeth's Client</option>
                  <option value="Anil">👤 Anil's Client</option>
                </select>
              </div>

              {/* Existing Client Dropdown */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Existing Client (Optional)
                </label>
                <select
                  value={newRecord.clientId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    const selectedC = clientsList.find((c) => c.id === cid);
                    setNewRecord({
                      ...newRecord,
                      clientId: cid,
                      name: selectedC ? selectedC.name : newRecord.name,
                      panNumber: selectedC?.panNumber ? selectedC.panNumber : newRecord.panNumber,
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Or enter client details below --</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.panNumber || c.clientCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRecord.name}
                  onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                  placeholder="Full Client Name"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* PAN Number */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={newRecord.panNumber}
                  onChange={(e) => setNewRecord({ ...newRecord, panNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  className="w-full p-2.5 uppercase font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Income Tax Password
                </label>
                <input
                  type="text"
                  value={newRecord.password}
                  onChange={(e) => setNewRecord({ ...newRecord, password: e.target.value })}
                  placeholder="IT Portal Password"
                  className="w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Price & Received Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newRecord.price}
                    onChange={(e) => setNewRecord({ ...newRecord, price: e.target.value })}
                    placeholder="e.g. 1500"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Received or Not
                  </label>
                  <select
                    value={newRecord.isReceived ? 'YES' : 'NO'}
                    onChange={(e) => setNewRecord({ ...newRecord, isReceived: e.target.value === 'YES' })}
                    className="w-full p-2.5 font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="NO">Not Received</option>
                    <option value="YES">Received</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit ITR Record Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit ITR Record
              </h3>
              <button onClick={() => setSelectedReturn(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-3.5 text-xs">
              {/* Assigned To */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assigned Partner / Manager
                </label>
                <select
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="w-full p-2.5 font-bold bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg"
                >
                  <option value="Puneeth">👤 Puneeth</option>
                  <option value="Anil">👤 Anil</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* PAN Number */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={editPan}
                  onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full p-2.5 uppercase font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Price & Received Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Received or Not
                  </label>
                  <select
                    value={editIsReceived ? 'YES' : 'NO'}
                    onChange={(e) => setEditIsReceived(e.target.value === 'YES')}
                    className="w-full p-2.5 font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="NO">Not Received</option>
                    <option value="YES">Received</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Bulk Import ITR Records (.xlsx)
              </h3>
              <button onClick={() => setShowImportModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    ITR Import Excel Template
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Columns: Name, PAN Number, Password, Price, Received or Not, Assigned To
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100"
                >
                  Download Template
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Excel (.xlsx) File
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              {importRows.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
                  ✓ Ready to import {importRows.length} ITR records.
                </div>
              )}

              {importReport && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-slate-900 dark:text-white">Import Result</p>
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="text-emerald-600">Success: {importReport.success}</span>
                    <span className="text-rose-600">Failed: {importReport.failed}</span>
                  </div>
                  {importReport.errors?.length > 0 && (
                    <div className="max-h-32 overflow-y-auto text-[10px] text-rose-500 font-mono space-y-0.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                      {importReport.errors.map((err: string, idx: number) => (
                        <p key={idx}>{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleBulkImportSubmit}
                  disabled={importing || importRows.length === 0}
                  className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Upload & Process Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
