import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Sparkles, LogIn, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = new URLSearchParams(location.search).get('redirect') || null;

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'officer') {
        navigate('/officer/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      const user = await demoLogin(role);
      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'officer') {
        navigate('/officer/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      setError('Demo login failed. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-civic-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-civic-600 to-indigo-500 flex items-center justify-center text-white shadow-lg">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">GrievAI</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Sign In to Civic Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter credentials or select a 1-click Demo Account below
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Quick Demo Switcher Card */}
        <div className="glass-panel p-4 rounded-2xl border border-civic-500/30 mb-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-civic-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              1-Click Demo Login (Instant Evaluation)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('citizen')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-civic-500 text-left transition"
            >
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Citizen</span>
                <span className="text-[10px] text-emerald-400">John</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">citizen@grievai.gov</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-civic-500 text-left transition"
            >
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Admin</span>
                <span className="text-[10px] text-rose-400">Chief</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">admin@grievai.gov</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('water_officer')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-civic-500 text-left transition"
            >
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Water Officer</span>
                <span className="text-[10px] text-blue-400">Robert</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">officer.water@grievai.gov</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('roads_officer')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-civic-500 text-left transition"
            >
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Roads Officer</span>
                <span className="text-[10px] text-amber-400">Sarah</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">officer.roads@grievai.gov</div>
            </button>
          </div>
        </div>

        {/* Standard Email/Password Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-glass">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-civic-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-civic-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-civic-500 to-civic-600 hover:from-civic-400 hover:to-civic-500 text-white text-xs font-bold transition shadow-md shadow-civic-500/25 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-civic-400 hover:underline">
              Create citizen account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
