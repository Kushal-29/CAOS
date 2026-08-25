import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Building2, ShieldCheck, FolderLock, FileSpreadsheet, FileCheck,
  Calendar, CheckCircle2, Phone, Mail, Clock, Plus,
  Eye, EyeOff, Send, ArrowLeft, History, FileText, Edit3, Trash2, AlertTriangle
} from 'lucide-react';
import { clientApi, credentialApi } from '../lib/api';
import { Client } from '../types';
import EditClientModal from '../components/clients/EditClientModal';
import toast from 'react-hot-toast';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'gst' | 'itr' | 'documents' | 'credentials' | 'tasks' | 'notes' | 'activity'
  >('overview');

  // Secret Visibility Toggle for Credentials
  const [revealedSecrets, setRevealedSecrets] = useState<{ [key: string]: string }>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClient = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await clientApi.delete(id);
      toast.success('Client profile deleted successfully');
      navigate('/clients');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  // Notes Form State
  const [noteBody, setNoteBody] = useState('');
  const [noteCategory, setNoteCategory] = useState<'INTERNAL' | 'FOLLOWUP' | 'MEETING' | 'GENERAL'>('INTERNAL');

  useEffect(() => {
    if (id) fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const data = await clientApi.get(id!);
      setClient(data);
    } catch (err) {
      toast.error('Failed to load client profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim() || !id) return;
    try {
      await clientApi.addNote(id, noteBody, noteCategory);
      toast.success('Note saved successfully');
      setNoteBody('');
      fetchClientDetails();
    } catch (err) {
      toast.error('Failed to save note');
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
      toast.success('Password decrypted & access logged');
    } catch (err) {
      toast.error('Failed to decrypt credential');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Client Profile Not Found</h2>
        <button onClick={() => navigate('/clients')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          Return to Client Roster
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-indigo-500/20">
            {client.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{client.name}</h1>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md">
                {client.clientCode}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                client.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-700'
              }`}>
                {client.status || 'ACTIVE'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {client.entityType || client.clientType}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {client.mobile}</span>
              {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {client.email}</span>}
              {client.panNumber && <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">PAN: {client.panNumber}</span>}
              {client.gstin && <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">GSTIN: {client.gstin}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-700">
          <div className="text-right text-xs">
            <p className="text-slate-400 font-medium">Assigned Manager</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{client.manager?.name || 'Unassigned'}</p>
          </div>
          <div className="text-right text-xs pl-3 border-l border-slate-200 dark:border-slate-700">
            <p className="text-slate-400 font-medium">Assigned Employee</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{client.assignedEmployee?.name || 'Unassigned'}</p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition-colors ml-2"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {showEditModal && client && (
        <EditClientModal
          client={client}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchClientDetails}
        />
      )}

      {showDeleteModal && client && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Client Profile?</h3>
                <p className="text-xs text-slate-500 font-mono">{client.clientCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{client.name}</strong>? This action cannot be undone and will permanently remove all associated GST returns, ITR filings, tasks, and documents.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exact 8 Phase 1 Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: '1. Overview', icon: User },
          { id: 'gst', label: `2. GST (${client.gstReturns?.length || 0})`, icon: FileSpreadsheet },
          { id: 'itr', label: `3. ITR (${client.itrReturns?.length || 0})`, icon: FileCheck },
          { id: 'documents', label: `4. Documents (${client.documents?.length || 0})`, icon: FolderLock },
          { id: 'credentials', label: `5. Credentials (${client.credentials?.length || 0})`, icon: ShieldCheck },
          { id: 'tasks', label: `6. Tasks (${client.tasks?.length || 0})`, icon: CheckCircle2 },
          { id: 'notes', label: `7. Notes (${client.notes?.length || 0})`, icon: Clock },
          { id: 'activity', label: `8. Activity History`, icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Personal Details</h3>
              <div className="space-y-2 text-xs">
                <div><span className="text-slate-400">Client Code:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.clientCode}</span></div>
                <div><span className="text-slate-400">Full Name:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.name}</span></div>
                <div><span className="text-slate-400">Mobile:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.mobile}</span></div>
                <div><span className="text-slate-400">Alt Mobile:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.alternateMobile || 'N/A'}</span></div>
                <div><span className="text-slate-400">Email:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.email || 'N/A'}</span></div>
                <div><span className="text-slate-400">PAN Number:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{client.panNumber || 'N/A'}</span></div>
                <div><span className="text-slate-400">Aadhaar:</span> <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{client.aadhaar || 'N/A'}</span></div>
                <div><span className="text-slate-400">Date of Birth:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.dob ? new Date(client.dob).toLocaleDateString() : 'N/A'}</span></div>
                <div><span className="text-slate-400">State:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.state || 'Delhi'}</span></div>
                <div><span className="text-slate-400">Address:</span> <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{client.address || 'N/A'}</p></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Business Details</h3>
              <div className="space-y-2 text-xs">
                <div><span className="text-slate-400">Entity Type:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.entityType || client.clientType}</span></div>
                <div><span className="text-slate-400">Business Type:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.businessType || 'Trading & Services'}</span></div>
                <div><span className="text-slate-400">GSTIN:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{client.gstin || 'N/A'}</span></div>
                <div><span className="text-slate-400">TAN Number:</span> <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{client.tan || 'N/A'}</span></div>
                <div><span className="text-slate-400">CIN Number:</span> <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{client.cin || 'N/A'}</span></div>
                <div><span className="text-slate-400">GST Status:</span> <span className="font-semibold text-emerald-600">{client.gstStatus || 'ACTIVE'}</span></div>
                <div><span className="text-slate-400">GST Frequency:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.gstFilingFrequency || 'MONTHLY'}</span></div>
                <div><span className="text-slate-400">ITR Type:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.itrType || 'ITR4'}</span></div>
                <div><span className="text-slate-400">Business Address:</span> <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{client.businessAddress || client.address || 'N/A'}</p></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Practice & Staff Assignment</h3>
              <div className="space-y-2 text-xs">
                <div><span className="text-slate-400">Assigned Manager:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.manager?.name || 'Unassigned'}</span></div>
                <div><span className="text-slate-400">Assigned Employee:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.assignedEmployee?.name || 'Unassigned'}</span></div>
                <div><span className="text-slate-400">Client Status:</span> <span className="font-semibold text-emerald-600">{client.status || 'ACTIVE'}</span></div>
                <div><span className="text-slate-400">Client Since:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(client.createdAt).toLocaleDateString()}</span></div>
                <div><span className="text-slate-400">Last Filed AY:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.lastFiledAy || 'AY 2024-25'}</span></div>
                <div><span className="text-slate-400">GST Client:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.isGstClient ? 'Yes' : 'No'}</span></div>
                <div><span className="text-slate-400">ITR Client:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{client.isItrClient ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: GST */}
        {activeTab === 'gst' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">GST Returns Matrix (GSTR-1, GSTR-3B, CMP08, GSTR-9)</h3>
              <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-md">
                Frequency: {client.gstFilingFrequency || 'MONTHLY'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Period</th>
                    <th className="p-3">Return Type</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Ack / ARN Number</th>
                    <th className="p-3">Filed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {client.gstReturns && client.gstReturns.length > 0 ? (
                    client.gstReturns.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{g.period}</td>
                        <td className="p-3 font-mono font-bold text-indigo-600">{g.returnType}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{new Date(g.dueDate).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            g.status === 'FILED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {g.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{g.ackNumber || '—'}</td>
                        <td className="p-3 text-slate-500">{g.filedDate ? new Date(g.filedDate).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">No GST return records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: ITR */}
        {activeTab === 'itr' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Income Tax Returns Workspace</h3>
              <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950 text-indigo-300 font-bold px-2.5 py-1 rounded-md">
                Form: {client.itrType || 'ITR4'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Assessment Year</th>
                    <th className="p-3">Filing Status</th>
                    <th className="p-3">Refund Status</th>
                    <th className="p-3">Notice Status</th>
                    <th className="p-3">Ack Number</th>
                    <th className="p-3">Filed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {client.itrReturns && client.itrReturns.length > 0 ? (
                    client.itrReturns.map((itr) => (
                      <tr key={itr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{itr.assessmentYear}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                            {itr.filingStatus}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-600">{itr.refundStatus}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            itr.noticeStatus === 'NOTICE_ISSUED' ? 'bg-rose-100 text-rose-700' : 'text-slate-500'
                          }`}>
                            {itr.noticeStatus}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{itr.acknowledgementNo || '—'}</td>
                        <td className="p-3 text-slate-500">{itr.filedDate ? new Date(itr.filedDate).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">No ITR records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Categorized Client Folders</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['PAN', 'AADHAAR', 'GST', 'ITR', 'TDS', 'BANK', 'AUDIT', 'ROC', 'OTHER'].map((folder) => (
                <div key={folder} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex items-center gap-3">
                  <FolderLock className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{folder}</p>
                    <p className="text-[10px] text-slate-400">
                      {client.documents?.filter((d) => d.folder?.toUpperCase() === folder || d.category === folder).length || 0} files
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700 border-t border-slate-100 dark:border-slate-700 pt-2">
              {client.documents && client.documents.length > 0 ? (
                client.documents.map((doc) => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <FolderLock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{doc.fileName}</p>
                        <p className="text-[10px] text-slate-400">Folder: {doc.folder || doc.category} • Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg hover:bg-indigo-100">
                      Preview / Download
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No uploaded documents for this client.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Credentials */}
        {activeTab === 'credentials' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Encrypted Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.credentials && client.credentials.length > 0 ? (
                client.credentials.map((cred) => (
                  <div key={cred.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-indigo-100 text-indigo-700 font-mono">
                        {cred.type}
                      </span>
                      <span className="text-[10px] text-slate-400">Updated: {new Date(cred.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div><span className="text-slate-400">Portal Username:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{cred.portalUsername}</span></div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Password:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {revealedSecrets[cred.id] || '••••••••••••'}
                          </span>
                          <button
                            onClick={() => handleRevealSecret(cred.id)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="Toggle Visibility"
                          >
                            {revealedSecrets[cred.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 col-span-2 text-center">No stored credentials for this client.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Client Task Board</h3>
            <div className="space-y-2">
              {client.tasks && client.tasks.length > 0 ? (
                client.tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        {task.department && <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600">{task.department}</span>}
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{task.title}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Assignee: {task.assignee?.name || 'Unassigned'} • Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-indigo-50 text-indigo-700 font-semibold">
                      {task.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No tasks assigned for this client.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <form onSubmit={handleAddNote} className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Add Client Note</h4>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200"
                >
                  <option value="INTERNAL">Internal Note</option>
                  <option value="FOLLOWUP">Follow-up Note</option>
                  <option value="MEETING">Meeting Note</option>
                  <option value="GENERAL">General Note</option>
                </select>
              </div>
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Enter client discussion, follow-up notes, or meeting minutes..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  <Send className="w-3.5 h-3.5" /> Save Note
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {client.notes && client.notes.length > 0 ? (
                client.notes.map((note) => (
                  <div key={note.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{note.author?.name || 'Staff'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">{note.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No notes recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 8: Activity History */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Audit & Activity History</h3>
            <div className="space-y-2">
              {client.activityLogs && client.activityLogs.length > 0 ? (
                client.activityLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                      <span className="text-slate-400 font-mono text-[10px] ml-2">[{log.entityType}]</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">By: {log.user?.name || 'System'}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No activity history logged yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
