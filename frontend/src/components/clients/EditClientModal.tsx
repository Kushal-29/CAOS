import React, { useState, useEffect } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { clientApi } from '../../lib/api';
import { Client } from '../../types';
import toast from 'react-hot-toast';

interface EditClientModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditClientModal({ client, isOpen, onClose, onSuccess }: EditClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    address: '',
    state: '',
    dob: '',
    panNumber: '',
    aadhaar: '',
    clientType: 'INDIVIDUAL',
    entityType: 'INDIVIDUAL',
    businessType: '',
    gstin: '',
    tan: '',
    cin: '',
    businessAddress: '',
    status: 'ACTIVE',
    isGstClient: true,
    isItrClient: false,
    gstUsername: '',
    gstFilingFrequency: 'MONTHLY',
    itUsername: '',
    itrType: 'ITR4',
    lastFiledAy: 'AY 2024-25',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        mobile: client.mobile || '',
        alternateMobile: client.alternateMobile || '',
        email: client.email || '',
        address: client.address || '',
        state: client.state || 'Delhi',
        dob: client.dob ? new Date(client.dob).toISOString().slice(0, 10) : '',
        panNumber: client.panNumber || '',
        aadhaar: client.aadhaar || '',
        clientType: client.clientType || 'INDIVIDUAL',
        entityType: client.entityType || client.clientType || 'INDIVIDUAL',
        businessType: client.businessType || '',
        gstin: client.gstin || '',
        tan: client.tan || '',
        cin: client.cin || '',
        businessAddress: client.businessAddress || '',
        status: client.status || 'ACTIVE',
        isGstClient: client.isGstClient ?? true,
        isItrClient: client.isItrClient ?? false,
        gstUsername: client.gstUsername || '',
        gstFilingFrequency: client.gstFilingFrequency || 'MONTHLY',
        itUsername: client.itUsername || '',
        itrType: client.itrType || 'ITR4',
        lastFiledAy: client.lastFiledAy || 'AY 2024-25',
      });
    }
  }, [client]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      toast.error('Client Name and Mobile are required');
      return;
    }

    try {
      setSaving(true);
      await clientApi.update(client.id, formData);
      toast.success('Client profile updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update client profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-600" /> Edit Client Profile — {client.name} ({client.clientCode})
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Personal Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
              1. Personal Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Client Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mobile Number *</label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Alternate Mobile</label>
                <input
                  type="text"
                  value={formData.alternateMobile}
                  onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
                  placeholder="Secondary phone"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@email.com"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">PAN Number</label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  className="w-full p-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Aadhaar Number</label>
                <input
                  type="text"
                  value={formData.aadhaar}
                  onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                  placeholder="12-digit Aadhaar"
                  className="w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Karnataka, Delhi"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Residential / Postal Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder="Full address details"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Section 2: Business & Statutory Identifiers */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
              2. Business & Tax Identifiers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Entity Type</label>
                <select
                  value={formData.clientType}
                  onChange={(e) => setFormData({ ...formData, clientType: e.target.value as any, entityType: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="INDIVIDUAL">INDIVIDUAL</option>
                  <option value="PROPRIETORSHIP">PROPRIETORSHIP</option>
                  <option value="PARTNERSHIP">PARTNERSHIP</option>
                  <option value="LLP">LLP</option>
                  <option value="PRIVATE_LIMITED">PRIVATE LIMITED</option>
                  <option value="PUBLIC_LIMITED">PUBLIC LIMITED</option>
                  <option value="HUF">HUF</option>
                  <option value="TRUST">TRUST</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Business Description / Industry</label>
                <input
                  type="text"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  placeholder="e.g. Retail, HR, IT Consulting"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">GSTIN</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="29ABCCS8504K1ZY"
                  className="w-full p-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">TAN Number</label>
                <input
                  type="text"
                  value={formData.tan}
                  onChange={(e) => setFormData({ ...formData, tan: e.target.value.toUpperCase() })}
                  placeholder="BLRA12345B"
                  className="w-full p-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">CIN Number (If Company)</label>
                <input
                  type="text"
                  value={formData.cin}
                  onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })}
                  placeholder="U72200KA2020PTC123456"
                  className="w-full p-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Client Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Practice Workspace Toggles & Portal Logins */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
              3. Service Configuration & Portal Logins
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGstClient}
                    onChange={(e) => setFormData({ ...formData, isGstClient: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Include in GST Workspace</span>
                </label>

                {formData.isGstClient && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">GST Portal Username</label>
                      <input
                        type="text"
                        value={formData.gstUsername}
                        onChange={(e) => setFormData({ ...formData, gstUsername: e.target.value })}
                        placeholder="GST Username"
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Filing Frequency</label>
                      <select
                        value={formData.gstFilingFrequency}
                        onChange={(e) => setFormData({ ...formData, gstFilingFrequency: e.target.value as any })}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="MONTHLY">MONTHLY</option>
                        <option value="QUARTERLY">QUARTERLY</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isItrClient}
                    onChange={(e) => setFormData({ ...formData, isItrClient: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Include in ITR Workspace</span>
                </label>

                {formData.isItrClient && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Income Tax Login ID</label>
                      <input
                        type="text"
                        value={formData.itUsername}
                        onChange={(e) => setFormData({ ...formData, itUsername: e.target.value })}
                        placeholder="PAN or User ID"
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">ITR Form</label>
                        <select
                          value={formData.itrType}
                          onChange={(e) => setFormData({ ...formData, itrType: e.target.value as any })}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="ITR1">ITR-1</option>
                          <option value="ITR2">ITR-2</option>
                          <option value="ITR3">ITR-3</option>
                          <option value="ITR4">ITR-4</option>
                          <option value="ITR5">ITR-5</option>
                          <option value="ITR6">ITR-6</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Last AY</label>
                        <input
                          type="text"
                          value={formData.lastFiledAy}
                          onChange={(e) => setFormData({ ...formData, lastFiledAy: e.target.value })}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
