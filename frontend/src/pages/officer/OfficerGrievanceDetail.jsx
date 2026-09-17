import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  FileText, MapPin, Calendar, CheckCircle2, PlayCircle, Clock,
  ArrowLeft, Upload, Check, AlertCircle, Sparkles, Building2, User, X, Loader2
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/common/Timeline';
import { AIExplainabilityCard } from '../../components/common/AIExplainabilityCard';

export const OfficerGrievanceDetail = () => {
  const { id } = useParams();

  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status Action States
  const [progressRemarks, setProgressRemarks] = useState('Field team dispatched to site for inspection.');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Evidence Form States
  const [evidenceRemarks, setEvidenceRemarks] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceMeta, setEvidenceMeta] = useState(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [submittingResolution, setSubmittingResolution] = useState(false);
  const [resolutionSuccess, setResolutionSuccess] = useState('');

  const fetchGrievance = async () => {
    try {
      const res = await apiClient.get(`/grievances/${id}`);
      setGrievance(res.data);
    } catch (err) {
      setError('Could not load assigned grievance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievance();
  }, [id]);

  const handleStartWork = async () => {
    setUpdatingProgress(true);
    try {
      await apiClient.patch(`/grievances/${id}/status`, {
        status: 'In Progress',
        remarks: progressRemarks
      });
      setResolutionSuccess('Status updated to In Progress.');
      fetchGrievance();
      setTimeout(() => setResolutionSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleEvidenceFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEvidence(true);
    setError('');

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('folder', 'evidence');

    try {
      const res = await apiClient.post('/grievances/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEvidenceFile(file);
      setEvidenceMeta(res.data);
    } catch (err) {
      setError('Evidence photo upload failed. Please use JPG or PNG.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleResolveGrievance = async (e) => {
    e.preventDefault();
    if (!evidenceRemarks.trim()) {
      setError('Please provide resolution remarks detailing the work performed.');
      return;
    }

    setSubmittingResolution(true);
    try {
      await apiClient.post(`/grievances/${id}/evidence`, {
        remarks: evidenceRemarks.trim(),
        file_url: evidenceMeta?.file_url || '/uploads/evidence/work_completed.jpg',
        file_name: evidenceMeta?.file_name || 'resolution_evidence.jpg'
      });
      setResolutionSuccess('Grievance marked as Resolved with evidence! Citizen has been notified.');
      fetchGrievance();
      setTimeout(() => setResolutionSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit resolution.');
    } finally {
      setSubmittingResolution(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading task file...</div>;
  }

  if (!grievance) {
    return <div className="py-20 text-center text-xs text-slate-500">Task not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/officer/dashboard"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assigned Queue
        </Link>
        <span className="text-[11px] font-mono text-slate-500">
          Case ID: {grievance.id.slice(0, 8)}
        </span>
      </div>

      {resolutionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resolutionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Complaint Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 shadow-glass">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-civic-400 bg-civic-500/10 px-3 py-1 rounded-full border border-civic-500/20">
              {grievance.category}
            </span>
            <StatusBadge status={grievance.status} />
            <PriorityBadge priority={grievance.priority} />
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Assigned: {new Date(grievance.created_at).toLocaleString()}</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white">{grievance.title}</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          {grievance.description}
        </p>

        {/* Location & Citizen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{grievance.address || `${grievance.latitude}, ${grievance.longitude}`}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-4 h-4 text-civic-400 shrink-0" />
            <span>Reporter: <strong className="text-white">{grievance.citizen?.name || 'Citizen'}</strong> ({grievance.citizen?.phone || 'No phone'})</span>
          </div>
        </div>
      </div>

      {/* Officer Workflow Action Card */}
      {grievance.status === 'Assigned' && (
        <div className="glass-panel p-6 rounded-2xl border border-blue-500/30 bg-blue-950/20 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
            <PlayCircle className="w-5 h-5 text-blue-400" />
            <span>Step 1: Acknowledge & Begin Field Action</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Transition this complaint status to <strong>"In Progress"</strong> to notify the citizen that inspection and repair works have started.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Field remark (e.g. Squad dispatched to site with equipment)"
              value={progressRemarks}
              onChange={(e) => setProgressRemarks(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-civic-500"
            />
            <button
              onClick={handleStartWork}
              disabled={updatingProgress}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 shrink-0"
            >
              {updatingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Set Status "In Progress"
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Resolution Evidence Upload (When In Progress) */}
      {grievance.status === 'In Progress' && (
        <form onSubmit={handleResolveGrievance} className="glass-panel p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Step 2: Upload Resolution Proof & Complete Task</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Upload photographic or document proof of completed municipal work and provide clear resolution remarks.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Resolution Remarks / Details of Work Performed <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detail what repairs or cleanup were completed on-site (e.g. Pipeline repaired with ductile iron collar and pressure restored to normal)..."
              value={evidenceRemarks}
              onChange={(e) => setEvidenceRemarks(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Evidence File Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Resolution Photo Proof / Work Order Document
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-4 text-center bg-slate-900/50 transition relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleEvidenceFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {evidenceFile ? (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{evidenceFile.name} (Attached)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-xs text-slate-400">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span>{uploadingEvidence ? 'Uploading proof...' : 'Click or drop resolution photo (JPG, PNG)'}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingResolution}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2"
          >
            {submittingResolution ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Marking Resolved & Notifying Citizen...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Resolved with Evidence</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Completed State Proof View */}
      {grievance.status === 'Resolved' && grievance.resolution_evidence && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Task Completed & Verified</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs">
            <div className="font-semibold text-emerald-300 mb-1">Uploaded Remarks:</div>
            <p className="text-slate-200 leading-relaxed italic">
              "{grievance.resolution_evidence.remarks}"
            </p>
          </div>
        </div>
      )}

      {/* Explainable AI Recommendations */}
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

      {/* Timeline */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-civic-400" />
          Status Progress Timeline
        </h3>
        <Timeline
          currentStatus={grievance.status}
          statusHistory={grievance.status_history || []}
        />
      </div>
    </div>
  );
};
