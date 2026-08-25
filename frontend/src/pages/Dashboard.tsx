import React, { useState, useEffect } from 'react';
import {
  Users, Building2, Receipt, AlertTriangle, CheckCircle2, Clock,
  Wallet, FileSpreadsheet, FileCheck, ArrowUpRight, ArrowDownRight, BellRing, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '../lib/api';
import { DashboardData } from '../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#94A3B8',
  IN_PROGRESS: '#3B82F6',
  WAITING_FOR_CLIENT: '#F59E0B',
  REVIEW: '#8B5CF6',
  COMPLETED: '#10B981',
  OVERDUE: '#EF4444',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      setData(res);
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const { kpis, upcomingDeadlines, tasksByStatus, productivity } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Shell */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
            <span>✨ CAOS Firm Operating System 700+</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Practice Command Center</h1>
          <p className="text-xs text-indigo-200/80">Real-time governance across 700+ ITR clients, GST returns, deadlines & revenue</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="px-4 py-2.5 bg-white text-indigo-950 font-bold text-xs rounded-xl shadow hover:bg-indigo-50 transition-colors flex items-center gap-1"
          >
            <Users className="w-4 h-4" /> Client Master Roster
          </button>
          <button
            onClick={() => navigate('/revenue')}
            className="px-4 py-2.5 bg-indigo-600/80 text-white font-bold text-xs rounded-xl hover:bg-indigo-600 border border-indigo-400/30 transition-colors flex items-center gap-1"
          >
            <Wallet className="w-4 h-4" /> Revenue & Fees
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total & Active Clients */}
        <div
          onClick={() => navigate('/clients')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-500 transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Master Roster</p>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis.totalClients}</p>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              {kpis.activeClients} Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">GST: {kpis.gstClientsCount} • ITR: {kpis.itrClientsCount}</p>
        </div>

        {/* Card 2: GST Pending Returns */}
        <div
          onClick={() => navigate('/gst')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-500 transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">GST Pending Returns</p>
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600">{kpis.gstPendingCount}</p>
          <p className="text-[11px] text-slate-400">GSTR-1, GSTR-3B & GSTR-9 Action Needed</p>
        </div>

        {/* Card 3: ITR Pending Returns */}
        <div
          onClick={() => navigate('/itr')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-500 transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">ITR Pending Returns</p>
            <FileCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-blue-600">{kpis.itrPendingCount}</p>
          <p className="text-[11px] text-slate-400">AY 2025-26 & AY 2024-25 Filings</p>
        </div>

        {/* Card 4: Outstanding Revenue */}
        <div
          onClick={() => navigate('/revenue')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-500 transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Outstanding Revenue</p>
            <Wallet className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-3xl font-extrabold text-rose-600">₹{kpis.outstandingRevenue?.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400">Collected: ₹{kpis.collectedRevenue?.toLocaleString()}</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Staff Productivity & Task Completion</h3>
              <p className="text-xs text-slate-400">Completed client assignments this month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={productivity}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="completedTasks" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks Status Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Tasks by Status</h3>
            <p className="text-xs text-slate-400">Distribution across active workflow stages</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={tasksByStatus} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {tasksByStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Deadlines & Action Items */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Upcoming Practice Deadlines (Next 7 Days)</h3>
            <p className="text-xs text-slate-400">GST, ITR & TDS statutory compliance dates</p>
          </div>
          <button onClick={() => navigate('/compliance')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View Compliance Calendar <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {upcomingDeadlines.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No statutory filings due in the next 7 days.</p>
          ) : (
            upcomingDeadlines.map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{f.client?.name} <span className="font-mono text-indigo-600 font-normal">({f.client?.clientCode})</span></p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{f.type} • Period: {f.period} • Due Date: {new Date(f.dueDate).toLocaleDateString()}</p>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-md ${
                  f.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {f.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
