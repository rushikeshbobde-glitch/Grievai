import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, MapPin, Calendar, CheckCircle, Clock, ShieldAlert,
  ArrowLeft, Star, Image as ImageIcon, Send, Sparkles, Building2, User
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge, SentimentBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/common/Timeline';
import { AIExplainabilityCard } from '../../components/common/AIExplainabilityCard';
import { LeafletMapPicker } from '../../components/common/LeafletMapPicker';

export const GrievanceDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Citizen Feedback Form State
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const fetchGrievance = async () => {
    try {
      const res = await apiClient.get(`/grievances/${id}`);
      setGrievance(res.data);
    } catch (err) {
      setError('Failed to load grievance details or unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievance();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await apiClient.post(`/grievances/${id}/feedback`, {
        rating,
        comment: feedbackComment.trim()
      });
      setFeedbackSuccess(true);
      fetchGrievance();
    } catch (err) {
      console.error('Feedback submission error:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading grievance redressal data...</div>;
  }

  if (error || !grievance) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center max-w-lg mx-auto">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white">Grievance Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">{error || 'Unable to locate this complaint ID.'}</p>
        <Link to="/citizen/dashboard" className="inline-block mt-4 text-xs font-semibold text-civic-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/citizen/grievances"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Grievances
        </Link>
        <span className="text-[11px] font-mono text-slate-500">
          UUID: {grievance.id}
        </span>
      </div>

      {/* Main Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 shadow-glass">
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
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          {grievance.description}
        </p>

        {/* Location & Department Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{grievance.address || 'GPS Coordinates Attached'}</span>
          </div>
          {grievance.department && (
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 className="w-4 h-4 text-civic-400 shrink-0" />
              <span>Assigned Dept: <strong className="text-white">{grievance.department.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* 4-Stage Status Tracking Timeline */}
      <div className="glass-panel p-6 rounded-2xl border border-civic-500/30 shadow-lg">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-civic-400" />
          4-Stage Redressal Tracking Timeline
        </h3>
        <Timeline
          currentStatus={grievance.status}
          statusHistory={grievance.status_history || []}
        />
      </div>

      {/* Resolution Evidence Card (When Resolved) */}
      {grievance.resolution_evidence && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
            <CheckCircle className="w-5 h-5" />
            <span>Verified Resolution Evidence (Officer Proof)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30">
              <div className="font-semibold text-emerald-300 mb-1">Officer Resolution Remarks:</div>
              <p className="text-slate-200 leading-relaxed italic">
                "{grievance.resolution_evidence.remarks}"
              </p>
            </div>

            <div className="text-[11px] text-slate-400">
              Evidence Document / Proof: <strong className="text-slate-200">{grievance.resolution_evidence.file_name}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Feedback / Rating Card */}
      {grievance.status === 'Resolved' && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Citizen Redressal Rating & Feedback
          </h3>

          {grievance.feedback || feedbackSuccess ? (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs">
              <div className="flex items-center gap-1 text-amber-400 font-bold mb-1">
                {[...Array(grievance.feedback?.rating || rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
                <span className="ml-2 text-white">({grievance.feedback?.rating || rating}/5 Stars)</span>
              </div>
              <p className="text-slate-300 mt-1 italic">
                "{grievance.feedback?.comment || feedbackComment || 'Feedback recorded.'}"
              </p>
              <div className="text-[10px] text-emerald-400 mt-2 font-medium">✓ Feedback registered in municipal database</div>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Please rate the speed and effectiveness of the municipal resolution:
              </p>

              {/* Star Selector */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-600 hover:text-amber-400 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-white ml-2">{rating} out of 5 Stars</span>
              </div>

              {/* Comment */}
              <textarea
                rows={2}
                placeholder="Share your feedback on the resolution quality..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-civic-500 transition resize-none"
              />

              <button
                type="submit"
                disabled={submittingFeedback}
                className="px-4 py-2 rounded-xl bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit Rating
              </button>
            </form>
          )}
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
    </div>
  );
};
