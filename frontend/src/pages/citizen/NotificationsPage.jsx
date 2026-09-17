import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Bell, CheckCircle2, ArrowRight } from 'lucide-react';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await apiClient.patch(`/notifications/${notif.id}/read`);
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Notifications Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time status updates and department action alerts</p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-civic-300 text-xs font-semibold transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
          <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No notifications yet</h3>
          <p className="text-xs text-slate-500 mt-1">You'll receive notifications when grievance statuses change.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`glass-card p-4 rounded-xl border cursor-pointer transition flex items-center justify-between gap-4 ${
                n.is_read
                  ? 'border-slate-800 text-slate-400 opacity-80'
                  : 'border-civic-500/40 text-slate-100 bg-civic-950/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">{n.title}</span>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-civic-400 animate-pulse" />}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-slate-400 mt-1.5">
                  {new Date(n.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
