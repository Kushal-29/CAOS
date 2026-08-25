import React, { useState, useEffect } from 'react';
import { UserCheck, UserPlus, Shield, Lock, Award, Mail, Phone, Calendar, X, CheckCircle2, Ban, Key } from 'lucide-react';
import { employeeApi } from '../lib/api';
import { Employee } from '../types';
import toast from 'react-hot-toast';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  // Add Staff Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    phone: '',
    password: '',
  });

  // Reset Password Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmpId, setResetEmpId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeApi.list();
      setEmployees(data);
    } catch (err) {
      toast.error('Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    try {
      await employeeApi.create(newStaff);
      toast.success('Staff user created successfully');
      setShowAddModal(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create staff user');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await employeeApi.toggleActive(id);
      toast.success(res.message);
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmpId || !newPassword) return;
    try {
      await employeeApi.resetPassword(resetEmpId, newPassword);
      toast.success('Password reset successfully');
      setShowResetModal(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleSelectEmployee = async (id: string) => {
    try {
      const data = await employeeApi.getById(id);
      setSelectedEmp(data);
    } catch (err) {
      toast.error('Failed to load employee details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-600" /> Staff & User Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Firm Articles, Senior Associates, Managers & Partner RBAC Operations
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Add Staff User
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading staff directory...</div>
        ) : (
          employees.map((emp) => {
            const score = emp.totalTasksCount > 0 ? Math.round((emp.completedTasksCount / emp.totalTasksCount) * 100) : 100;
            return (
              <div
                key={emp.id}
                onClick={() => handleSelectEmployee(emp.id)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-500 transition-all cursor-pointer space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold text-base flex items-center justify-center shadow">
                      {emp.name[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {emp.role}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${emp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300">
                    <Award className="w-3.5 h-3.5" />
                    <span className="text-xs font-extrabold">{score}%</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {emp.email}</p>
                  {emp.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {emp.phone}</p>}
                  <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined: {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'Jan 2024'}</p>
                </div>

                {/* Workload Metric Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-medium">Clients</p>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{emp.assignedClientsCount}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">
                    <p className="text-[10px] text-amber-600 font-medium">Pending Tasks</p>
                    <p className="text-sm font-extrabold text-amber-700 dark:text-amber-400">{emp.pendingTasksCount}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg">
                    <p className="text-[10px] text-emerald-600 font-medium">Done Tasks</p>
                    <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">{emp.completedTasksCount}</p>
                  </div>
                </div>

                {/* Management Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setResetEmpId(emp.id);
                      setShowResetModal(true);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200 flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" /> Reset Password
                  </button>
                  <button
                    onClick={(e) => handleToggleActive(emp.id, emp.isActive, e)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded flex items-center gap-1 ${
                      emp.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    <Ban className="w-3 h-3" /> {emp.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Staff User</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. CA Priya Sharma"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="priya@firm.com"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Firm Role</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Article)</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN (Partner)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Password *</label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Staff Password</h3>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="px-4 py-2 font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
