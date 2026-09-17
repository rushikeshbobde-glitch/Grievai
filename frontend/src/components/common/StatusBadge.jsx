import React from 'react';
import { Clock, UserCheck, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const configs = {
    'Submitted': {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Clock,
      dot: 'bg-amber-400',
    },
    'Assigned': {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: UserCheck,
      dot: 'bg-blue-400',
    },
    'In Progress': {
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: PlayCircle,
      dot: 'bg-indigo-400 animate-pulse',
    },
    'Resolved': {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
      dot: 'bg-emerald-400',
    },
    'Rejected': {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: XCircle,
      dot: 'bg-rose-400',
    }
  };

  const config = configs[status] || configs['Submitted'];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
};
