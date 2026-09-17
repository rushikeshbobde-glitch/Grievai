import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Download, FileText, Filter, CheckCircle2, Table, Calendar } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const ReportsExport = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await apiClient.get('/grievances?limit=100');
      setGrievances(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filtered = grievances.filter((g) => {
    const matchesStatus = statusFilter ? g.status === statusFilter : true;
    const matchesCategory = categoryFilter ? g.category === categoryFilter : true;
    const matchesPriority = priorityFilter ? g.priority === priorityFilter : true;
    return matchesStatus && matchesCategory && matchesPriority;
  });

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const res = await apiClient.get(`/analytics/export-csv?${params.toString()}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `grievances_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Export Grievance Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Download real filtered municipal records in CSV spreadsheet format for audits and administrative reporting
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          disabled={downloading || filtered.length === 0}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating CSV...' : `Download CSV Report (${filtered.length} rows)`}
        </button>
      </div>

      {/* Filter Parameters */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-civic-400" /> Report Filter Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Category Filter</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
            >
              <option value="">All Categories</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Roads/Potholes">Roads/Potholes</option>
              <option value="Electricity/Street Lights">Electricity/Street Lights</option>
              <option value="Sanitation/Waste">Sanitation/Waste</option>
              <option value="Traffic">Traffic</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Priority Filter</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
            >
              <option value="">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Preview Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Table className="w-4 h-4 text-civic-400" />
            Filtered Live Records Preview ({filtered.length} matching rows)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-3 py-2.5">Title</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.slice(0, 10).map((g) => (
                <tr key={g.id} className="hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-medium text-white max-w-xs truncate">{g.title}</td>
                  <td className="px-3 py-2">{g.category}</td>
                  <td className="px-3 py-2"><PriorityBadge priority={g.priority} /></td>
                  <td className="px-3 py-2"><StatusBadge status={g.status} /></td>
                  <td className="px-3 py-2 text-[11px] text-slate-400">{new Date(g.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
