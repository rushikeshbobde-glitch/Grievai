import React from 'react';
import { Sparkles, Brain, CheckCircle2, ShieldAlert, Building2, Tag, Compass } from 'lucide-react';
import { PriorityBadge, SentimentBadge } from './PriorityBadge';

export const AIExplainabilityCard = ({
  category,
  confidence,
  priority,
  priorityScore,
  priorityReason,
  sentiment,
  sentimentScore,
  recommendedDepartment,
  summary,
  recommendedAction,
  keywords = []
}) => {
  const confidencePercent = Math.round((confidence || 0.85) * 100);

  return (
    <div className="glass-panel p-5 rounded-xl border border-civic-500/30 bg-slate-900/80 shadow-glass relative overflow-hidden">
      {/* Subtle Glow Backdrop */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-civic-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-civic-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              Explainable AI Triage Insights
              <span className="text-[11px] bg-civic-500/20 text-civic-300 px-2 py-0.5 rounded-full border border-civic-500/30">
                Lightweight NLP
              </span>
            </h4>
            <p className="text-xs text-slate-400">Automated classification and resolution guidance</p>
          </div>
        </div>

        {/* Confidence Indicator */}
        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Model Confidence</div>
          <div className="text-sm font-bold text-civic-400">{confidencePercent}%</div>
        </div>
      </div>

      {/* Grid of Key AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        {/* Category Box */}
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
            <Tag className="w-3.5 h-3.5 text-civic-400" />
            Predicted Category
          </div>
          <div className="text-sm font-semibold text-white">{category || 'General Civic'}</div>
          {/* Confidence bar */}
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-civic-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Priority & Urgency */}
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Predicted Priority
          </div>
          <div className="mt-1">
            <PriorityBadge priority={priority || 'Medium'} score={priorityScore} />
          </div>
        </div>

        {/* Department & Sentiment */}
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            Recommended Department
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {recommendedDepartment || 'Public Works'}
          </div>
          <div className="mt-1.5">
            <SentimentBadge sentiment={sentiment || 'Neutral'} score={sentimentScore} />
          </div>
        </div>
      </div>

      {/* Priority Reason / Urgency Cues */}
      {priorityReason && (
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 mb-3 text-xs">
          <span className="font-semibold text-slate-300">Urgency Justification: </span>
          <span className="text-slate-400">{priorityReason}</span>
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 mb-3 text-xs">
          <span className="font-semibold text-slate-300">1-Line AI Summary: </span>
          <span className="text-slate-300 italic">"{summary}"</span>
        </div>
      )}

      {/* Recommended Action (SOP) */}
      {recommendedAction && (
        <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
            <Compass className="w-3.5 h-3.5" />
            Recommended Resolution Action:
          </div>
          <p className="text-slate-200 leading-relaxed">{recommendedAction}</p>
        </div>
      )}

      {/* Extracted Key Tokens Chips */}
      {keywords && keywords.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">Influencing Keywords:</span>
          {keywords.map((k, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
            >
              #{k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
