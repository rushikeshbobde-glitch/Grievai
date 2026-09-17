import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import {
  FileText, CheckCircle2, Clock, PlayCircle, PlusCircle, ArrowRight,
  MapPin, ShieldAlert, Sparkles, AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/common/Timeline';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyGrievances = async () => {
      try {
        const res = await apiClient.get('/grievances/my');
        setGrievances(res.data);
      } catch (err) {
        console.error('Error fetching grievances:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyGrievances();
  }, []);

  const total = grievances.length;
  const pending = grievances.filter((g) => g.status === 'Submitted').length;
  const inProgress = grievances.filter((g) => g.status === 'In Progress' || g.status === 'Assigned').length;
  const resolved = grievances.filter((g) => g.status === 'Resolved').length;

  const latestActive = grievances.find((g) => g.status !== 'Resolved') || grievances[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-civic-950/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-400 bg-civic-500/10 px-2 py-0.5 rounded border border-civic-500/20">
              Citizen Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Welcome back, {user?.name || 'Citizen'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your submitted public grievances and receive real-time resolution updates.
          </p>
        </div>

        <Link
          to="/citizen/submit"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-civic-500 to-civic-600 hover:from-civic-400 hover:to-civic-500 text-white text-xs font-bold transition shadow-md shadow-civic-500/25 flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Report New Grievance
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Complaints</span>
            <FileText className="w-4 h-4 text-civic-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{total}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pending Triage</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{pending}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Under Action</span>
            <PlayCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 mt-2">{inProgress}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Resolved Proofs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">{resolved}</div>
        </div>
      </div>

      {/* Active Grievance Live Timeline Card */}
      {latestActive && (
        <div className="glass-panel p-5 rounded-2xl border border-civic-500/30 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-civic-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Status Tracker
              </h3>
            </div>
            <Link
              to={`/citizen/grievances/${latestActive.id}`}
              className="text-xs text-civic-400 hover:text-civic-300 font-semibold flex items-center gap-1"
            >
              Full Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-white">{latestActive.title}</span>
              <StatusBadge status={latestActive.status} />
              <PriorityBadge priority={latestActive.priority} />
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">{latestActive.description}</p>
          </div>

          <Timeline
            currentStatus={latestActive.status}
            statusHistory={latestActive.status_history || []}
          />
        </div>
      )}

      {/* Recent Grievances List */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Recent Grievances</h3>
          <Link
            to="/citizen/grievances"
            className="text-xs text-civic-400 hover:text-civic-300 font-medium"
          >
            View All ({grievances.length})
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading grievances...</div>
        ) : grievances.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">You have not submitted any complaints yet.</p>
            <Link
              to="/citizen/submit"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-civic-600 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Report an Issue
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {grievances.slice(0, 5).map((g) => (
              <Link
                key={g.id}
                to={`/citizen/grievances/${g.id}`}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-lg transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-white truncate">{g.title}</span>
                    <StatusBadge status={g.status} />
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>{g.category}</span>
                    <span>•</span>
                    <span>{new Date(g.created_at).toLocaleDateString()}</span>
                    {g.address && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{g.address}</span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
