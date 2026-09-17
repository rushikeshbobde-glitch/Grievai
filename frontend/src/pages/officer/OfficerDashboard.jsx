import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import {
  Shield, CheckCircle2, PlayCircle, Clock, ArrowRight, MapPin,
  AlertTriangle, Sparkles, Building2
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const OfficerDashboard = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssigned = async () => {
    try {
      const res = await apiClient.get('/grievances/assigned');
      setGrievances(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  const assignedCount = grievances.filter((g) => g.status === 'Assigned').length;
  const inProgressCount = grievances.filter((g) => g.status === 'In Progress').length;
  const resolvedCount = grievances.filter((g) => g.status === 'Resolved').length;

  // Sort by priority (High -> Medium -> Low)
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  const sortedGrievances = [...grievances].sort((a, b) => {
    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Field Officer Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Officer Tasks & Field Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as: <strong className="text-white">{user?.name}</strong> • Prioritized by urgency
          </p>
        </div>

        <Link
          to="/officer/history"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 shrink-0"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Resolution History ({resolvedCount})
        </Link>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Assigned Cases</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">{assignedCount}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Field Work In Progress</span>
            <PlayCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 mt-2">{inProgressCount}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Successfully Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">{resolvedCount}</div>
        </div>
      </div>

      {/* Assigned Tasks Prioritized List */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-civic-400" />
            Assigned Complaints Queue ({sortedGrievances.length})
          </h3>
          <span className="text-[11px] text-slate-400">Sorted by High Urgency First</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading assigned tasks...</div>
        ) : sortedGrievances.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-white">No active assigned tasks</p>
            <p className="text-[11px] text-slate-500 mt-0.5">You are all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGrievances.map((g) => (
              <div
                key={g.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-civic-500/40 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-civic-400 bg-civic-500/10 px-2.5 py-0.5 rounded-full border border-civic-500/20">
                      {g.category}
                    </span>
                    <PriorityBadge priority={g.priority} />
                    <StatusBadge status={g.status} />
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Received: {new Date(g.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{g.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {g.description}
                  </p>
                </div>

                {/* AI SOP Recommendation preview */}
                {g.ai_recommendation && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs">
                    <span className="font-semibold text-indigo-300">AI Suggested Action: </span>
                    <span className="text-slate-300 italic">{g.ai_recommendation}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 truncate">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{g.address || `${g.latitude}, ${g.longitude}`}</span>
                  </div>

                  <Link
                    to={`/officer/grievances/${g.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-civic-600 hover:bg-civic-500 text-white font-bold transition flex items-center gap-1 shrink-0"
                  >
                    Action Task <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
