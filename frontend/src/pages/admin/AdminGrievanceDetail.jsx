import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  FileText, MapPin, Calendar, CheckCircle, Clock, ShieldAlert,
  ArrowLeft, UserCheck, Settings, Copy, Building2, User, Sparkles, AlertTriangle
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge, SentimentBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/common/Timeline';
import { AIExplainabilityCard } from '../../components/common/AIExplainabilityCard';

export const AdminGrievanceDetail = () => {
  const { id } = useParams();

  const [grievance, setGrievance] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');

  const [overrideCategory, setOverrideCategory] = useState('');
  const [overridePriority, setOverridePriority] = useState('');
  const [overrideRemarks, setOverrideRemarks] = useState('');

  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [gRes, dRes, oRes, dupRes] = await Promise.all([
        apiClient.get(`/grievances/${id}`),
        apiClient.get('/departments'),
        apiClient.get('/departments/officers'),
        apiClient.get(`/grievances/${id}/duplicates`)
      ]);
      setGrievance(gRes.data);
      setDepartments(dRes.data);
      setOfficers(oRes.data);
      setDuplicates(dupRes.data || []);

      setSelectedDeptId(gRes.data.department_id || (dRes.data[0]?.id || ''));
      setSelectedOfficerId(gRes.data.assigned_officer_id || '');
      setOverrideCategory(gRes.data.category);
      setOverridePriority(gRes.data.priority);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await apiClient.patch(`/grievances/${id}/assign`, {
        department_id: selectedDeptId,
        officer_id: selectedOfficerId || null,
        remarks: assignRemarks || 'Assigned by admin.'
      });
      setActionSuccess('Grievance successfully assigned to department and officer!');
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOverride = async (e) => {
    e.preventDefault();
    try {
      await apiClient.patch(`/grievances/${id}/override`, {
        category: overrideCategory,
        priority: overridePriority,
        department_id: selectedDeptId,
        remarks: overrideRemarks || 'Administrative override.'
      });
      setActionSuccess('AI categorization & priority successfully overridden!');
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading grievance admin file...</div>;
  }

  if (!grievance) {
    return <div className="py-20 text-center text-xs text-slate-500">Grievance not found.</div>;
  }

  const deptOfficers = officers.filter(
    (o) => !selectedDeptId || o.department_id === selectedDeptId
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/grievances"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Triage Queue
        </Link>
        <span className="text-[11px] font-mono text-slate-500">
          UUID: {grievance.id}
        </span>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grievance Summary Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-glass">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-civic-400 bg-civic-500/10 px-3 py-1 rounded-full border border-civic-500/20">
              {grievance.category}
            </span>
            <StatusBadge status={grievance.status} />
            <PriorityBadge priority={grievance.priority} score={grievance.ai_confidence ? Math.round(grievance.ai_confidence * 100) : null} />
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Submitted: {new Date(grievance.created_at).toLocaleString()}</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white">{grievance.title}</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/70 p-4 rounded-xl border border-slate-800">
          {grievance.description}
        </p>

        {/* Citizen Info & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-4 h-4 text-civic-400 shrink-0" />
            <span>Citizen: <strong className="text-white">{grievance.citizen?.name || 'Citizen User'}</strong> ({grievance.citizen?.email})</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{grievance.address || `${grievance.latitude}, ${grievance.longitude}`}</span>
          </div>
        </div>
      </div>

      {/* Potential Duplicates Warning Banner (if any) */}
      {duplicates.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Flagged Duplicate Complaints ({duplicates.length})</span>
            </div>
            <Link
              to="/admin/duplicates"
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Open Duplicate Manager
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {duplicates.map((dup) => (
              <div key={dup.grievance_id} className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 text-xs">
                <div className="font-bold text-white mb-1 truncate">{dup.title}</div>
                <div className="flex items-center justify-between text-[11px] text-amber-300">
                  <span>Cosine Similarity: <strong>{dup.similarity_score}%</strong></span>
                  {dup.distance_meters && <span>Distance: ~{dup.distance_meters}m</span>}
                </div>
                <Link
                  to={`/admin/grievances/${dup.grievance_id}`}
                  className="inline-block mt-2 text-[11px] text-civic-400 hover:underline"
                >
                  Inspect Matched Grievance →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explainable AI Triage Card */}
      <AIExplainabilityCard
        category={grievance.ai_category || grievance.category}
        confidence={grievance.ai_confidence}
        priority={grievance.ai_priority || grievance.priority}
        priorityReason={grievance.priority_reason}
        sentiment={grievance.sentiment}
        sentimentScore={grievance.sentiment_score}
        recommendedDepartment={grievance.department?.name || 'Municipal Works'}
        summary={grievance.ai_summary}
        recommendedAction={grievance.ai_recommendation}
        keywords={grievance.ai_keywords || []}
      />

      {/* Human-in-the-Loop Admin Action Grid: Left Assign, Right Override */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assign Department & Officer Form */}
        <form onSubmit={handleAssign} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <UserCheck className="w-4 h-4 text-civic-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Assign Department & Officer
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Department
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
              Assign Field Officer
            </label>
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500"
            >
              <option value="">Auto-Assign to Available Officer</option>
              {deptOfficers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.user?.name} — {o.designation} ({o.badge_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assignment Directive Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Inspect pipeline pressure and deploy repair team within 4 hours."
              value={assignRemarks}
              onChange={(e) => setAssignRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" /> Save Assignment
          </button>
        </form>

        {/* Human-in-the-Loop Override Form */}
        <form onSubmit={handleOverride} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Settings className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Human-in-the-Loop Override
            </h3>
          </div>

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
              placeholder="e.g. Reclassified to High priority based on site danger assessment."
              value={overrideRemarks}
              onChange={(e) => setOverrideRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" /> Save Human Override
          </button>
        </form>
      </div>

      {/* 4-Stage Status History Timeline */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-civic-400" />
          Audit Trail & Status Timeline
        </h3>
        <Timeline
          currentStatus={grievance.status}
          statusHistory={grievance.status_history || []}
        />
      </div>
    </div>
  );
};
