import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Copy, BarChart3, Building2, Users, Download,
  CheckCircle2, Clock, ShieldAlert, Sparkles, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/admin/grievances', label: 'Grievances Queue', icon: FileText },
    { to: '/admin/duplicates', label: 'Duplicate AI Manager', icon: Copy, badge: 'AI' },
    { to: '/admin/analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { to: '/admin/departments', label: 'Departments & Officers', icon: Building2 },
    { to: '/admin/reports', label: 'Export Reports (CSV)', icon: Download },
  ];

  const officerLinks = [
    { to: '/officer/dashboard', label: 'Assigned Grievances', icon: LayoutDashboard },
    { to: '/officer/history', label: 'Resolution Proofs & History', icon: CheckCircle2 },
  ];

  const citizenLinks = [
    { to: '/citizen/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/citizen/submit', label: 'Report Grievance', icon: FileText },
    { to: '/citizen/grievances', label: 'All My Complaints', icon: Clock },
    { to: '/citizen/notifications', label: 'Notifications', icon: Sparkles },
  ];

  const links = isAdmin ? adminLinks : isOfficer ? officerLinks : citizenLinks;

  return (
    <aside className="w-64 shrink-0 hidden lg:block glass-panel border-r border-slate-800 bg-slate-900/60 p-4 min-h-[calc(100vh-4rem)]">
      {/* Role Header Banner */}
      <div className="p-3 mb-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/40 border border-slate-700/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-civic-500/20 text-civic-400 flex items-center justify-center border border-civic-500/30 font-bold">
          {isAdmin ? 'ADM' : isOfficer ? 'OFF' : 'CIT'}
        </div>
        <div>
          <div className="text-xs font-bold text-white capitalize">{user?.name}</div>
          <div className="text-[11px] text-civic-400 capitalize font-medium">{user?.role} Portal</div>
        </div>
      </div>

      {/* Nav Link List */}
      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-civic-500/15 text-civic-400 border border-civic-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
