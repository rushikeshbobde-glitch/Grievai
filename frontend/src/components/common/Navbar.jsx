import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import {
  Shield, Bell, User, LogOut, FileText, CheckCircle, BarChart3, Users,
  Layers, PlusCircle, ChevronDown, Sparkles
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    if (user) {
      try {
        const res = await apiClient.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id, link) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setShowNotifs(false);
      if (link) navigate(link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchDemo = async (role) => {
    await demoLogin(role);
    setShowDemoMenu(false);
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role.includes('officer')) navigate('/officer/dashboard');
    else navigate('/citizen/dashboard');
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-civic-600 via-civic-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-civic-500/20 group-hover:scale-105 transition">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white">Griev</span>
              <span className="text-xl font-black tracking-tight text-civic-400">AI</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-civic-500/20 text-civic-300 px-1.5 py-0.5 rounded border border-civic-500/30 ml-1">
                Gov Portal
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">AI Civic Redressal & Resolution</p>
          </div>
        </Link>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              location.pathname === '/' ? 'text-civic-400 bg-civic-500/10' : 'text-slate-300 hover:text-white'
            }`}
          >
            Home
          </Link>

          {user?.role === 'citizen' && (
            <>
              <Link
                to="/citizen/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname.startsWith('/citizen/dashboard') ? 'text-civic-400 bg-civic-500/10' : 'text-slate-300 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/citizen/grievances"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname === '/citizen/grievances' ? 'text-civic-400 bg-civic-500/10' : 'text-slate-300 hover:text-white'
                }`}
              >
                My Grievances
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname === '/admin/dashboard' ? 'text-civic-400 bg-civic-500/10' : 'text-slate-300 hover:text-white'
                }`}
              >
                Admin Hub
              </Link>
              <Link
                to="/admin/grievances"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname.startsWith('/admin/grievances') ? 'text-civic-400 bg-civic-500/10' : 'text-slate-300 hover:text-white'
                }`}
              >
                Grievances Queue
              </Link>
              <Link
                to="/admin/duplicates"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname === '/admin/duplicates' ? 'text-civic-400 bg-civic-500/10' : 'text-slate-300 hover:text-white'
                }`}
              >
                Duplicate AI
              </Link>
            </>
          )}

          {user?.role === 'officer' && (
            <>
              <Link
                to="/officer/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname === '/officer/dashboard' ? 'text-civic-400 bg-civic-500/10' : 'text-slate-300 hover:text-white'
                }`}
              >
                Officer Tasks
              </Link>
              <Link
                to="/officer/history"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname === '/officer/history' ? 'text-civic-400 bg-civic-500/10' : 'text-slate-300 hover:text-white'
                }`}
              >
                Resolved Proofs
              </Link>
            </>
          )}
        </nav>

        {/* Right Action Icons & Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Switcher Button (Hackathon Presentation Helper) */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-civic-600/20 to-indigo-600/20 border border-civic-500/40 text-civic-300 hover:text-white text-xs font-semibold transition shadow-sm"
              title="Quickly switch between Citizen, Admin, and Officer demo accounts"
            >
              <Sparkles className="w-3.5 h-3.5 text-civic-400" />
              <span className="hidden sm:inline">Demo Switcher</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl shadow-2xl p-2 z-50 border border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Select Role Account
                </div>
                <button
                  onClick={() => handleSwitchDemo('citizen')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">Citizen (John Doe)</div>
                    <div className="text-[10px] text-slate-400">citizen@grievai.gov</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Citizen</span>
                </button>
                <button
                  onClick={() => handleSwitchDemo('admin')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">Admin (Chief Officer)</div>
                    <div className="text-[10px] text-slate-400">admin@grievai.gov</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Admin</span>
                </button>
                <button
                  onClick={() => handleSwitchDemo('water_officer')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">Water Officer (Robert)</div>
                    <div className="text-[10px] text-slate-400">officer.water@grievai.gov</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Officer</span>
                </button>
                <button
                  onClick={() => handleSwitchDemo('roads_officer')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">Roads Officer (Sarah)</div>
                    <div className="text-[10px] text-slate-400">officer.roads@grievai.gov</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Officer</span>
                </button>
              </div>
            )}
          </div>

          {/* Submit Grievance CTA Button */}
          <Link
            to="/citizen/submit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-civic-500 to-civic-600 hover:from-civic-400 hover:to-civic-500 text-white text-xs font-semibold transition shadow-md shadow-civic-500/25"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report Issue</span>
          </Link>

          {/* Notification Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-xl shadow-2xl p-3 z-50 border border-slate-700 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <span className="text-xs font-bold text-white">Notifications ({notifications.length})</span>
                    <button
                      onClick={async () => {
                        await apiClient.patch('/notifications/read-all');
                        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                      }}
                      className="text-[11px] text-civic-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No notifications yet</div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id, n.link)}
                          className={`p-2.5 rounded-lg text-xs cursor-pointer transition border ${
                            n.is_read
                              ? 'bg-slate-800/30 border-slate-800 text-slate-400'
                              : 'bg-civic-950/40 border-civic-500/30 text-slate-200'
                          }`}
                        >
                          <div className="font-semibold text-white flex items-center justify-between">
                            <span>{n.title}</span>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-civic-400" />}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">{n.message}</p>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Profile / Login Links */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white text-xs font-bold border border-slate-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl p-2 z-50 border border-slate-700">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <div className="text-xs font-bold text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-civic-500/20 text-civic-300 rounded">
                      Role: {user.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-lg bg-civic-600 hover:bg-civic-500 text-white text-xs font-semibold transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
