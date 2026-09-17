import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  FileText, Clock, PlayCircle, CheckCircle2, ShieldAlert, Copy,
  BarChart3, ArrowRight, Sparkles, MapPin, Building2, TrendingUp, Users
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { GrievanceMapHeatmap } from '../../components/common/GrievanceMapHeatmap';

const COLORS = ['#0c8fe9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#64748b'];

export const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [sumRes, trendRes, grievRes] = await Promise.all([
          apiClient.get('/analytics/summary'),
          apiClient.get('/analytics/trends?days=14'),
          apiClient.get('/grievances?limit=10')
        ]);
        setSummary(sumRes.data);
        setTrends(trendRes.data);
        setGrievances(grievRes.data);
      } catch (err) {
        console.error('Error loading admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading || !summary) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading municipal analytics...</div>;
  }

  const unassignedGrievances = grievances.filter((g) => g.status === 'Submitted');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Municipal Command Center
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Civic Triage & Redressal Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time explainable AI triage, department routing, and duplicate intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/duplicates"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-civic-400" />
            Duplicate AI ({summary.duplicate_count})
          </Link>
          <Link
            to="/admin/grievances"
            className="px-4 py-2 rounded-xl bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            Triage Queue
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Complaints</div>
          <div className="text-2xl font-black text-white mt-1">{summary.total_grievances}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-amber-400 text-xs font-medium">Pending Triage</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{summary.pending_grievances}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-blue-400 text-xs font-medium">Assigned</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{summary.assigned_grievances}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-indigo-400 text-xs font-medium">In Progress</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">{summary.in_progress_grievances}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-emerald-400 text-xs font-medium">Resolved Proofs</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{summary.resolved_grievances}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-rose-400 text-xs font-medium">High Priority</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{summary.high_priority_count}</div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Category Distribution Donut (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Category Distribution
            </h3>
            <span className="text-[11px] text-slate-400">Total: {summary.total_grievances}</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.categories_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {summary.categories_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
            {summary.categories_breakdown.map((cat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-slate-300 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate">{cat.name}:</span>
                <strong className="text-white ml-auto">{cat.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart: 14-Day Submission vs Resolution Trends (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-civic-400" />
              14-Day Grievance Trend (Submitted vs Resolved)
            </h3>
            <span className="text-[11px] text-emerald-400">Avg Resolution: {summary.avg_resolution_hours}h</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8fe9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0c8fe9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  name="Submitted"
                  stroke="#0c8fe9"
                  fillOpacity={1}
                  fill="url(#colorSubmitted)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geospatial Map Overview */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 shadow-glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Geographic Incident Hotspots (Live GPS Map)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Markers colored by Priority (Red: High, Gold: Medium, Blue: Low)</span>
        </div>

        <GrievanceMapHeatmap grievances={grievances} height="340px" />
      </div>

      {/* High-Urgency Unassigned Triage Queue */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Incoming Grievances Pending Review ({unassignedGrievances.length})
            </h3>
          </div>
          <Link
            to="/admin/grievances"
            className="text-xs text-civic-400 hover:underline font-semibold"
          >
            View Full Queue
          </Link>
        </div>

        {unassignedGrievances.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            ✓ All incoming grievances have been triaged and assigned!
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {unassignedGrievances.map((g) => (
              <div key={g.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">{g.title}</span>
                    <PriorityBadge priority={g.priority} />
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      AI Category: {g.ai_category || g.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{g.description}</p>
                </div>

                <Link
                  to={`/admin/grievances/${g.id}`}
                  className="px-3 py-1.5 rounded-lg bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition"
                >
                  Review & Assign <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
