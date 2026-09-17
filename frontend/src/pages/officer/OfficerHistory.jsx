import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { CheckCircle2, FileText, ArrowRight, Calendar, Star, Building2 } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const OfficerHistory = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get('/grievances/assigned');
        // Filter only resolved
        setGrievances(res.data.filter((g) => g.status === 'Resolved'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Resolution Proofs & History</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Archived log of all successfully completed and verified civic redressal cases
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading historical cases...</div>
      ) : grievances.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
          <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No completed tasks yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Grievances marked as Resolved with evidence will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grievances.map((g) => (
            <div
              key={g.id}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition space-y-3"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-civic-400 bg-civic-500/10 px-2.5 py-0.5 rounded-full border border-civic-500/20">
                    {g.category}
                  </span>
                  <PriorityBadge priority={g.priority} />
                  <StatusBadge status="Resolved" />
                </div>
                <span className="text-[11px] text-slate-400">
                  Resolved: {new Date(g.updated_at || g.created_at).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">{g.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {g.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-[11px] text-slate-400">
                  Location: <strong className="text-slate-200">{g.address || 'GPS Tagged'}</strong>
                </span>

                <Link
                  to={`/officer/grievances/${g.id}`}
                  className="text-civic-400 hover:underline font-semibold flex items-center gap-1"
                >
                  View Case & Evidence <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
