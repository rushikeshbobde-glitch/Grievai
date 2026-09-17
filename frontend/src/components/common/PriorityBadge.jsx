import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const PriorityBadge = ({ priority, score }) => {
  const configs = {
    'High': {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: AlertTriangle,
    },
    'Medium': {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: AlertCircle,
    },
    'Low': {
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      icon: Info,
    }
  };

  const config = configs[priority] || configs['Medium'];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {priority} Priority
      {score !== undefined && score !== null && (
        <span className="opacity-75 text-[10px] ml-0.5">({score}%)</span>
      )}
    </span>
  );
};

export const SentimentBadge = ({ sentiment, score }) => {
  const configs = {
    'Negative': {
      bg: 'bg-red-500/10 text-red-400 border-red-500/30',
      label: 'Distressed / Urgent',
    },
    'Neutral': {
      bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
      label: 'Neutral Tone',
    },
    'Positive': {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      label: 'Positive / Constructive',
    }
  };

  const config = configs[sentiment] || configs['Neutral'];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
      <span className="capitalize">{sentiment}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-75 text-[10px]">({score > 0 ? `+${score}` : score})</span>
      )}
    </span>
  );
};
