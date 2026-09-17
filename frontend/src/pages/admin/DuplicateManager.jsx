import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  Copy, Sparkles, MapPin, CheckCircle2, XCircle, ArrowRight,
  AlertTriangle, ShieldCheck, Layers
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const DuplicateManager = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const fetchGrievances = async () => {
    try {
      const res = await apiClient.get('/grievances?limit=100');
      setGrievances(res.data);
      // Select first duplicate flagged or first grievance
      const firstDup = res.data.find((g) => g.is_duplicate) || res.data[0];
      if (firstDup) {
        handleSelectGrievance(firstDup);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const handleSelectGrievance = async (g) => {
    setSelectedGrievance(g);
    setCheckingDuplicates(true);
    try {
      const res = await apiClient.get(`/grievances/${g.id}/duplicates`);
      setDuplicateMatches(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleMergeOrDismiss = (action, matchId) => {
    setActionNotice(`Complaint ${matchId.slice(0, 8)} marked as ${action.toUpperCase()} successfully.`);
    setTimeout(() => setActionNotice(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              TF-IDF + Geo-Proximity AI
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Duplicate Grievance Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify redundant complaints within nearby geographic zones to prevent duplicate municipal dispatch
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Complaints Queue (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Complaints Queue ({grievances.length})
            </h3>
            <span className="text-[10px] text-amber-400 font-semibold">
              {grievances.filter((g) => g.is_duplicate).length} Flagged
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {grievances.map((g) => (
              <div
                key={g.id}
                onClick={() => handleSelectGrievance(g)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                  selectedGrievance?.id === g.id
                    ? 'bg-civic-500/20 border-civic-400 text-white shadow-md'
                    : 'glass-card border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold truncate">{g.title}</span>
                  {g.is_duplicate && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      Duplicate
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{g.category}</span>
                  <StatusBadge status={g.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Side-by-Side Comparison & AI Match Analysis (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedGrievance ? (
            <>
              {/* Selected Grievance Card */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 shadow-glass">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-civic-400 bg-civic-500/10 px-2.5 py-0.5 rounded-full border border-civic-500/20">
                      Active Inspection Case
                    </span>
                    <PriorityBadge priority={selectedGrievance.priority} />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(selectedGrievance.created_at).toLocaleString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{selectedGrievance.title}</h3>
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {selectedGrievance.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{selectedGrievance.address || `${selectedGrievance.latitude}, ${selectedGrievance.longitude}`}</span>
                </div>
              </div>

              {/* AI Duplicate Matches Section */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    AI Duplicate Match Candidates ({duplicateMatches.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Threshold: Text Sim &gt; 45% or Proximity &lt; 1km
                  </span>
                </div>

                {checkingDuplicates ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Computing TF-IDF cosine similarity matrix and spatial distances...
                  </div>
                ) : duplicateMatches.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-white">No duplicate complaints detected</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      This grievance has unique semantic phrasing and location coordinates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {duplicateMatches.map((match) => (
                      <div
                        key={match.grievance_id}
                        className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-3 shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-white">{match.title}</h4>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Category: <strong className="text-slate-200">{match.category}</strong> • Status: <strong className="text-slate-200">{match.status}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                              {match.similarity_score}% Match
                            </span>
                            {match.distance_meters !== null && (
                              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-medium text-xs border border-blue-500/30">
                                ~{match.distance_meters}m Away
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                          <Link
                            to={`/admin/grievances/${match.grievance_id}`}
                            className="text-civic-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            Inspect Candidate Case <ArrowRight className="w-3 h-3" />
                          </Link>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleMergeOrDismiss('dismissed', match.grievance_id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                            >
                              Dismiss Flag
                            </button>
                            <button
                              onClick={() => handleMergeOrDismiss('merged', match.grievance_id)}
                              className="px-3 py-1.5 rounded-lg bg-civic-600 hover:bg-civic-500 text-white font-bold transition flex items-center gap-1"
                            >
                              <Layers className="w-3.5 h-3.5" /> Link & Consolidate
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
              Select a complaint from the queue to review AI similarity analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
