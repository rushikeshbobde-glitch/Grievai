import React from 'react';
import { CheckCircle, Clock, PlayCircle, UserCheck, AlertCircle } from 'lucide-react';

export const Timeline = ({ statusHistory = [], currentStatus = 'Submitted' }) => {
  const standardStages = [
    { key: 'Submitted', label: 'Complaint Submitted', icon: Clock, desc: 'Logged & AI Triaged' },
    { key: 'Assigned', label: 'Assigned to Department', icon: UserCheck, desc: 'Field Officer Assigned' },
    { key: 'In Progress', label: 'Action in Progress', icon: PlayCircle, desc: 'Field Work / Inspection' },
    { key: 'Resolved', label: 'Resolved with Evidence', icon: CheckCircle, desc: 'Verified & Proof Uploaded' },
  ];

  const getStageState = (stageKey) => {
    const order = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
    const currentIndex = order.indexOf(currentStatus);
    const stageIndex = order.indexOf(stageKey);

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getHistoryEntry = (stageKey) => {
    return statusHistory.find((h) => h.new_status === stageKey);
  };

  return (
    <div className="py-4">
      <div className="relative">
        {/* Continuous track line */}
        <div className="hidden md:block absolute top-5 left-8 right-8 h-0.5 bg-slate-800 -z-0" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {standardStages.map((stage, idx) => {
            const state = getStageState(stage.key);
            const history = getHistoryEntry(stage.key);
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="flex md:flex-col items-start md:items-center gap-3 md:text-center">
                {/* Stage Icon Node */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all shadow-md ${
                    state === 'completed'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                      : state === 'current'
                      ? 'bg-civic-500/20 border-civic-400 text-civic-400 ring-4 ring-civic-500/20'
                      : 'bg-slate-800/80 border-slate-700 text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Stage Info */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-white">{stage.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{stage.desc}</div>

                  {history && (
                    <div className="mt-1.5 p-2 rounded bg-slate-800/60 border border-slate-700/60 text-[11px] text-left">
                      <div className="text-civic-400 font-medium">
                        {new Date(history.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {history.remarks && (
                        <div className="text-slate-300 mt-0.5 italic text-[10px] line-clamp-2">
                          "{history.remarks}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
