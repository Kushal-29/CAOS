import React, { useState, useEffect } from 'react';
import { FolderLock, Upload, Search, FileText, Download, Trash2, Eye, Plus, Folder } from 'lucide-react';
import { documentApi, clientApi } from '../lib/api';
import { DocumentItem, Client } from '../types';
import toast from 'react-hot-toast';

const FOLDERS = [
  'All Documents',
  'PAN',
  'Aadhaar',
  'GST Certificate',
  'Form16',
  'ITR Returns',
  'Audit Reports',
  'Bank Statements',
  'Agreements',
  'Other',
];

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All Documents');

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [category, setCategory] = useState('FORM_16');
  const [folder, setFolder] = useState('Form16');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [search, selectedFolder]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentApi.list({
        search,
        folder: selectedFolder === 'All Documents' ? undefined : selectedFolder,
      });
      setDocuments(data);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUploadModal = async () => {
    try {
      const data = await clientApi.list({ pageSize: 100 });
      setClientsList(data.clients);
      if (data.clients.length > 0) setSelectedClientId(data.clients[0].id);
      setShowUploadModal(true);
    } catch (err) {
      toast.error('Failed to load clients list');
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedClientId) {
      toast.error('Please select a client and a file to upload');
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', selectedClientId);
      formData.append('category', category);
      formData.append('folder', folder);

      await documentApi.upload(formData);
      toast.success('Document uploaded successfully to Cloudinary');
      setShowUploadModal(false);
      setFile(null);
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentApi.delete(id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FolderLock className="w-7 h-7 text-indigo-600" /> Document Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Categorized Client Records, PAN, Aadhaar, GST Certificates, Notices & Audit Archives
          </p>
        </div>

        <button
          onClick={handleOpenUploadModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Folders Bar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {FOLDERS.map((f) => (
          <div
            key={f}
            onClick={() => setSelectedFolder(f)}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
              selectedFolder === f
                ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-950/60 dark:border-indigo-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
            }`}
          >
            <Folder className={`w-5 h-5 ${selectedFolder === f ? 'text-indigo-600' : 'text-slate-400'}`} />
            <div className="truncate">
              <p className={`text-xs font-bold truncate ${selectedFolder === f ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                {f}
              </p>
            </div>
          </div>
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
            placeholder="Search documents by file name..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Loading vault documents...</div>
        ) : documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 hover:border-indigo-500 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={doc.fileName}>
                    {doc.fileName}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Client: <span className="font-semibold">{doc.client?.name || 'General'}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                      {doc.folder || doc.category}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-600 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            No documents found in "{selectedFolder}".
          </div>
        )}
      </div>

      {/* Drag and Drop Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Document to Vault</h3>

            <form onSubmit={handleUploadFile} className="space-y-3 text-xs">
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
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Document Folder</label>
                <select
                  value={folder}
                  onChange={(e) => {
                    setFolder(e.target.value);
                    setCategory(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="PAN">PAN Card</option>
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="GST Certificate">GST Certificate</option>
                  <option value="Form16">Form 16 / Form 16A</option>
                  <option value="ITR Returns">ITR Return / Ack</option>
                  <option value="Audit Reports">Audit Report</option>
                  <option value="Bank Statements">Bank Statement</option>
                  <option value="Agreements">Agreements & Legal</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select File (PDF, Image, Word, Excel)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-3xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{previewDoc.fileName}</h3>
                <p className="text-xs text-slate-400">Client: {previewDoc.client?.name || 'N/A'}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="px-3 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                Close Preview
              </button>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center p-4">
              {previewDoc.mimeType?.includes('image') ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.fileName} className="max-h-[500px] object-contain rounded-lg" />
              ) : (
                <iframe src={previewDoc.fileUrl} title={previewDoc.fileName} className="w-full h-[500px] rounded-lg border-0" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
