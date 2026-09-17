import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  FileText, Upload, MapPin, Sparkles, AlertTriangle, CheckCircle2,
  AlertCircle, ArrowRight, X, Loader2
} from 'lucide-react';
import { LeafletMapPicker } from '../../components/common/LeafletMapPicker';
import { AIExplainabilityCard } from '../../components/common/AIExplainabilityCard';

export const SubmitGrievance = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    address: 'Connaught Place, Central District, New Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
  });

  const [attachment, setAttachment] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachmentMeta, setAttachmentMeta] = useState(null);

  // Live AI Triage State
  const [aiPreview, setAiPreview] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  // Live Duplicate Warning State
  const [duplicates, setDuplicates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const debounceTimer = useRef(null);

  // Debounced Live AI Analysis
  useEffect(() => {
    if (formData.title.trim().length >= 3 && formData.description.trim().length >= 8) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(async () => {
        setAnalyzingAI(true);
        try {
          const aiRes = await apiClient.post('/ai/analyze', {
            title: formData.title,
            description: formData.description,
            category: formData.category || null,
            latitude: formData.latitude,
            longitude: formData.longitude
          });
          setAiPreview(aiRes.data);

          // Check duplicates concurrently
          const dupRes = await apiClient.post('/ai/check-duplicates', {
            title: formData.title,
            description: formData.description,
            latitude: formData.latitude,
            longitude: formData.longitude
          });
          setDuplicates(dupRes.data || []);
        } catch (err) {
          console.error('AI preview error:', err);
        } finally {
          setAnalyzingAI(false);
        }
      }, 500);
    } else {
      setAiPreview(null);
      setDuplicates([]);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [formData.title, formData.description, formData.category, formData.latitude, formData.longitude]);

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('File exceeds maximum size of 15MB.');
      return;
    }

    setUploadingFile(true);
    setError('');

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('folder', 'attachments');

    try {
      const res = await apiClient.post('/grievances/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachment(file);
      setAttachmentMeta(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'File upload failed. Please use JPG, PNG, or PDF.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.title.trim().length < 3) {
      setError('Please provide a descriptive title (at least 3 characters).');
      return;
    }
    if (formData.description.trim().length < 10) {
      setError('Please provide a detailed description (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address.trim()
      };

      const res = await apiClient.post('/grievances', payload);
      navigate(`/citizen/grievances/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please check your inputs.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-civic-400 bg-civic-500/10 px-2 py-0.5 rounded border border-civic-500/20">
            Civic Redressal Form
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">Report a Public Grievance</h1>
        <p className="text-xs text-slate-400 mt-1">
          Submit civic issues with location coordinates. Our explainable NLP engine auto-triages urgency and routes to the appropriate municipal department.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form Left, AI Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-glass">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Grievance Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Main water supply pipeline burst near civic center"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-civic-500 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Detailed Description <span className="text-rose-400">*</span></span>
                {analyzingAI && (
                  <span className="text-[11px] text-civic-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> AI analyzing text...
                  </span>
                )}
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe the issue, duration, safety hazards, or affected residents (e.g. There has been no water supply in our area for three days...)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-civic-500 transition resize-none"
              />
            </div>

            {/* Optional Category Override */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category Selection (Optional)
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-civic-500 transition"
              >
                <option value="">⚡ Auto-Detect with AI (Recommended)</option>
                <option value="Water Supply">Water Supply & Sewerage</option>
                <option value="Roads/Potholes">Roads & Public Works (Potholes)</option>
                <option value="Electricity/Street Lights">Electricity & Public Lighting</option>
                <option value="Sanitation/Waste">Sanitation & Solid Waste Management</option>
                <option value="Traffic">Traffic & Transport Authority</option>
                <option value="Healthcare">Public Health & Sanitation</option>
                <option value="Education">Education & Public Schools</option>
                <option value="Other">General Civic Administration</option>
              </select>
            </div>

            {/* Location Map Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Incident Location Pin <span className="text-rose-400">*</span>
              </label>
              <LeafletMapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                height="240px"
              />
            </div>

            {/* Address Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. Sector 4, Central Avenue, Near Metro Gate 2"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-civic-500 transition"
              />
            </div>

            {/* File Attachment Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Photo or Document Attachment
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-civic-500/60 rounded-xl p-4 text-center bg-slate-900/50 transition relative">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {attachment ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttachment(null);
                        setAttachmentMeta(null);
                      }}
                      className="ml-2 text-rose-400 hover:text-rose-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-xs text-slate-400">
                    <Upload className="w-5 h-5 text-civic-400" />
                    <span>
                      {uploadingFile ? 'Uploading file...' : 'Click or drag photo / document proof (JPG, PNG, PDF)'}
                    </span>
                    <span className="text-[10px] text-slate-500">Max size: 15MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-civic-500 to-civic-600 hover:from-civic-400 hover:to-civic-500 text-white text-xs font-bold transition shadow-lg shadow-civic-500/25 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Triaging...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Submit Grievance</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Real-Time AI Explainability & Duplicate Alert (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Duplicate Warning Box */}
          {duplicates.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-lg">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Similar Grievance Detected Nearby</span>
              </div>
              <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                A similar issue has already been reported in this vicinity. Admins will link these records to accelerate combined field action.
              </p>
              <div className="space-y-1.5">
                {duplicates.slice(0, 2).map((dup, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900/80 border border-amber-500/20 text-xs">
                    <div className="font-semibold text-white truncate">{dup.title}</div>
                    <div className="text-[10px] text-amber-400 flex items-center gap-2 mt-0.5">
                      <span>Similarity: {dup.similarity_score}%</span>
                      {dup.distance_meters && <span>• Distance: ~{dup.distance_meters}m</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Live Analysis Preview Card */}
          {aiPreview ? (
            <AIExplainabilityCard
              category={aiPreview.category}
              confidence={aiPreview.confidence}
              priority={aiPreview.priority}
              priorityScore={aiPreview.priority_score}
              priorityReason={aiPreview.priority_reason}
              sentiment={aiPreview.sentiment}
              sentimentScore={aiPreview.sentiment_score}
              recommendedDepartment={aiPreview.recommended_department_name}
              summary={aiPreview.summary}
              recommendedAction={aiPreview.recommended_action}
              keywords={aiPreview.keywords}
            />
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center py-12">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-300">Live AI Triage Preview</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Type your grievance title and description to see instant category predictions, urgency scoring, and SOP recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
