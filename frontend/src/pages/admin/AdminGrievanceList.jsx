import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  FileText, Search, Filter, Download, ArrowRight, UserCheck, Settings,
  AlertCircle, CheckCircle2, Copy, X, Loader2
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const AdminGrievanceList = () => {
  const [grievances, setGrievances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Quick Assignment Modal State
  const [assignModalGrievance, setAssignModalGrievance] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);

  // Quick Override Modal State
  const [overrideModalGrievance, setOverrideModalGrievance] = useState(null);
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overridePriority, setOverridePriority] = useState('');
  const [overrideRemarks, setOverrideRemarks] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  const fetchData = async () => {
    try {
      const [gRes, dRes, oRes] = await Promise.all([
        apiClient.get('/grievances?limit=100'),
        apiClient.get('/departments'),
        apiClient.get('/departments/officers')
      ]);
      setGrievances(gRes.data);
      setDepartments(dRes.data);
      setOfficers(oRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = grievances.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.address && g.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter ? g.status === statusFilter : true;
    const matchesCategory = categoryFilter ? g.category === categoryFilter : true;
    const matchesPriority = priorityFilter ? g.priority === priorityFilter : true;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const handleOpenAssignModal = (g) => {
    setAssignModalGrievance(g);
    setSelectedDeptId(g.department_id || (departments.length > 0 ? departments[0].id : ''));
    setSelectedOfficerId(g.assigned_officer_id || '');
    setAssignRemarks(`Assigned to ${g.category} response team.`);
  };

  const handleSaveAssign = async (e) => {
    e.preventDefault();
    if (!assignModalGrievance || !selectedDeptId) return;
    setSavingAssign(true);
    try {
      await apiClient.patch(`/grievances/${assignModalGrievance.id}/assign`, {
        department_id: selectedDeptId,
        officer_id: selectedOfficerId || null,
        remarks: assignRemarks
      });
      setAssignModalGrievance(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAssign(false);
    }
  };

  const handleOpenOverrideModal = (g) => {
    setOverrideModalGrievance(g);
    setOverrideCategory(g.category);
    setOverridePriority(g.priority);
    setOverrideRemarks('Administrative review adjustment.');
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!overrideModalGrievance) return;
    setSavingOverride(true);
    try {
      await apiClient.patch(`/grievances/${overrideModalGrievance.id}/override`, {
        category: overrideCategory,
        priority: overridePriority,
        remarks: overrideRemarks
      });
      setOverrideModalGrievance(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/analytics/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'grievances_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Officers filtered by currently selected department in assign modal
  const departmentOfficers = officers.filter(
    (o) => !selectedDeptId || o.department_id === selectedDeptId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Grievances Redressal Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage, triage, override classifications, and assign municipal complaints
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-civic-400" /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search complaints or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-civic-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted (Pending Review)</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div>
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

      {/* Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Grievance & AI Tag</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Department / Officer</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    Loading queue records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No complaints found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-white truncate">{g.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {g.description}
                      </div>
                      {g.is_duplicate && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 mt-1">
                          <Copy className="w-2.5 h-2.5" /> Potential Duplicate
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-200">{g.category}</span>
                      {g.ai_confidence && (
                        <div className="text-[10px] text-civic-400">
                          {Math.round(g.ai_confidence * 100)}% Conf
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <PriorityBadge priority={g.priority} />
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={g.status} />
                    </td>

                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="font-medium text-slate-200 truncate">
                        {g.department?.name || <span className="text-amber-400 italic">Unassigned</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {g.assigned_officer?.user?.name || (g.department_id ? 'Pending Officer Assignment' : '')}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAssignModal(g)}
                          title="Assign Department & Officer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-civic-600 text-slate-300 hover:text-white transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenOverrideModal(g)}
                          title="Override AI Classification"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/admin/grievances/${g.id}`}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-civic-600 hover:bg-civic-500 text-white transition"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Assignment Modal */}
      {assignModalGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-civic-400" />
                Assign Department & Officer
              </h3>
              <button
                onClick={() => setAssignModalGrievance(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              <strong>Grievance:</strong> {assignModalGrievance.title}
            </div>

            <form onSubmit={handleSaveAssign} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Responsible Department
                </label>
                <select
                  required
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setSelectedOfficerId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Field Resolution Officer
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
                >
                  <option value="">Auto-Assign to Available Officer</option>
                  {departmentOfficers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.user?.name} — {o.designation} ({o.badge_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assignment Instructions / Remarks
                </label>
                <textarea
                  rows={2}
                  value={assignRemarks}
                  onChange={(e) => setAssignRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalGrievance(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssign}
                  className="px-4 py-2 rounded-xl bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  {savingAssign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Override Modal */}
      {overrideModalGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-civic-400" />
                Human-in-the-Loop Override
              </h3>
              <button
                onClick={() => setOverrideModalGrievance(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Override Category
                </label>
                <select
                  value={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
                >
                  <option value="Water Supply">Water Supply</option>
                  <option value="Roads/Potholes">Roads/Potholes</option>
                  <option value="Electricity/Street Lights">Electricity/Street Lights</option>
                  <option value="Sanitation/Waste">Sanitation/Waste</option>
                  <option value="Traffic">Traffic</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Override Priority
                </label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Audit Remarks / Justification
                </label>
                <textarea
                  rows={2}
                  value={overrideRemarks}
                  onChange={(e) => setOverrideRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalGrievance(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOverride}
                  className="px-4 py-2 rounded-xl bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  {savingOverride ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
