import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  FileText, Search, Filter, ArrowRight, MapPin, Calendar, PlusCircle
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const MyGrievances = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const res = await apiClient.get('/grievances/my');
        setGrievances(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrievances();
  }, []);

  const filtered = grievances.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.address && g.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter ? g.status === statusFilter : true;
    const matchesCategory = categoryFilter ? g.category === categoryFilter : true;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">My Grievance Redressals</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track real-time progress, assigned officers, and resolution evidence
          </p>
        </div>

        <Link
          to="/citizen/submit"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-civic-500 to-civic-600 hover:from-civic-400 hover:to-civic-500 text-white text-xs font-bold transition shadow-md shadow-civic-500/25 flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Report New Grievance
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by keywords or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-civic-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted (Pending Triage)</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
          >
            <option value="">All Categories</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Roads/Potholes">Roads & Potholes</option>
            <option value="Electricity/Street Lights">Electricity & Street Lights</option>
            <option value="Sanitation/Waste">Sanitation & Waste</option>
            <option value="Traffic">Traffic</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
          </select>
        </div>
      </div>

      {/* Grievance List Cards */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading grievances...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No grievances match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or search keywords.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => (
            <Link
              key={g.id}
              to={`/citizen/grievances/${g.id}`}
              className="block glass-card p-5 rounded-2xl border border-slate-800 hover:border-civic-500/40 transition group"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-civic-400 bg-civic-500/10 px-2.5 py-0.5 rounded-full border border-civic-500/20">
                    {g.category}
                  </span>
                  <StatusBadge status={g.status} />
                  <PriorityBadge priority={g.priority} />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(g.created_at).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-civic-300 transition mb-1">
                {g.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                {g.description}
              </p>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{g.address || 'GPS Coordinates Attached'}</span>
                </div>
                <span className="text-civic-400 font-semibold group-hover:translate-x-1 transition flex items-center gap-1 shrink-0">
                  Track Timeline <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
