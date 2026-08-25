import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Upload, Download, Search, Filter, Building2, Phone, Mail,
  ChevronRight, FileSpreadsheet, X, Edit3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { clientApi } from '../lib/api';
import { Client } from '../types';
import EditClientModal from '../components/clients/EditClientModal';
import toast from 'react-hot-toast';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Client Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    panNumber: '',
    gstin: '',
    aadhaar: '',
    clientType: 'INDIVIDUAL',
    businessType: 'Trading & Services',
    state: 'Delhi',
    address: '',
  });

  // Edit Client Modal
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Bulk Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientApi.list({ search, status: statusFilter });
      setClients(data.clients);
    } catch (err) {
      toast.error('Failed to load client roster');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.mobile) {
      toast.error('Client Name and Mobile are required');
      return;
    }
    try {
      await clientApi.create(newClient);
      toast.success('Client added successfully');
      setShowAddModal(false);
      fetchClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add client');
    }
  };

  // Download Excel Template for Client Import
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Client Name': 'M/s Apex Traders',
        'Mobile': '9876543210',
        'Alternate Mobile': '9876543211',
        'Email': 'contact@apextraders.com',
        'PAN': 'ABCDE1234F',
        'GSTIN': '07ABCDE1234F1Z5',
        'State': 'Delhi',
        'Business Type': 'Retail & Wholesale',
        'Address': '123 Chandni Chowk, Delhi',
        'GST Applicable': 'Yes',
        'ITR Applicable': 'Yes',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ClientsTemplate');
    XLSX.writeFile(wb, 'CAOS_Client_Import_Template.xlsx');
    toast.success('Downloaded client import template');
  };

  // Handle Excel File Upload Parse
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
        toast.success(`Parsed ${parsedData.length} client rows from Excel`);
      } catch (err) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImportSubmit = async () => {
    if (importRows.length === 0) {
      toast.error('Please upload an Excel file first');
      return;
    }
    try {
      setImporting(true);
      const res = await clientApi.import(importRows);
      setImportReport(res.results);
      toast.success(res.message);
      fetchClients();
    } catch (err) {
      toast.error('Failed to execute bulk client import');
    } finally {
      setImporting(false);
    }
  };

  // Export Clients to Excel
  const handleExportClients = async () => {
    try {
      const data = await clientApi.export();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ClientsRoster');
      XLSX.writeFile(wb, `CAOS_Clients_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${data.length} client profiles`);
    } catch (err) {
      toast.error('Failed to export client roster');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600" /> Client Master Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized 360° Directory for 700+ ITR & GST Clients
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Client
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
            onClick={handleExportClients}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Export (.xlsx)
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, PAN, GSTIN, Mobile..."
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading client roster...</div>
        ) : clients.length > 0 ? (
          clients.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-500 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold text-sm flex items-center justify-center shadow">
                      {c.name[0]}
                    </div>
                    <div>
                      <h3
                        onClick={() => navigate(`/clients/${c.id}`)}
                        className="text-sm font-bold text-slate-900 dark:text-white leading-tight hover:text-indigo-600 cursor-pointer"
                      >
                        {c.name}
                      </h3>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{c.clientCode}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.status || 'ACTIVE'}
                    </span>
                    {/* EDIT CLIENT BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClient(c);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                      title="Edit Client Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {c.mobile}</p>
                  {c.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}</p>}
                  <div className="flex items-center gap-2 pt-1 font-mono text-[11px] flex-wrap">
                    {c.panNumber ? (
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">PAN: {c.panNumber}</span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded">PAN Missing</span>
                    )}
                    {c.gstin ? (
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">GSTIN: {c.gstin}</span>
                    ) : (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded">No GSTIN</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <button
                  onClick={() => setEditingClient(c)}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Details
                </button>
                <button
                  onClick={() => navigate(`/clients/${c.id}`)}
                  className="font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1"
                >
                  View Profile <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            No client profiles found in database. Use "Add Client" or "Bulk Import" to populate.
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Client Profile</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Client Name *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={newClient.mobile}
                    onChange={(e) => setNewClient({ ...newClient, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Alternate Mobile</label>
                  <input
                    type="text"
                    value={newClient.alternateMobile}
                    onChange={(e) => setNewClient({ ...newClient, alternateMobile: e.target.value })}
                    placeholder="Optional"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="client@email.com"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={newClient.panNumber}
                    onChange={(e) => setNewClient({ ...newClient, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    className="w-full p-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={newClient.gstin}
                    onChange={(e) => setNewClient({ ...newClient, gstin: e.target.value.toUpperCase() })}
                    placeholder="07ABCDE1234F1Z5"
                    className="w-full p-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Entity Type</label>
                  <select
                    value={newClient.clientType}
                    onChange={(e) => setNewClient({ ...newClient, clientType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                    <option value="PROPRIETORSHIP">PROPRIETORSHIP</option>
                    <option value="PARTNERSHIP">PARTNERSHIP</option>
                    <option value="LLP">LLP</option>
                    <option value="PRIVATE_LIMITED">PRIVATE LIMITED</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">State</label>
                  <input
                    type="text"
                    value={newClient.state}
                    onChange={(e) => setNewClient({ ...newClient, state: e.target.value })}
                    placeholder="e.g. Delhi"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Profile Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={fetchClients}
        />
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Bulk Import Clients (.xlsx)
              </h3>
              <button onClick={() => setShowImportModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Standard Import Template</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Download pre-formatted Excel template with correct headers</p>
                </div>
                <button onClick={handleDownloadTemplate} className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100">
                  Download Template
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Excel (.xlsx / .xls) File</label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              {importRows.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
                  ✓ Ready to import {importRows.length} client records.
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
