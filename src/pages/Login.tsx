import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { Shield, Eye, EyeOff, Lock, User, CheckCircle2, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { setCurrentUser, showToast, theme, toggleTheme } = useApp();
  const [username, setUsername] = useState('admin@sekolah.sch.id');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const users = db.getUsers();
      const user = users.find(
        (u) =>
          (u.email.toLowerCase() === username.trim().toLowerCase() ||
            u.username.toLowerCase() === username.trim().toLowerCase()) &&
          u.status === 'aktif'
      );

      if (user) {
        setCurrentUser(user);
        showToast(`Selamat datang kembali, ${user.nama}!`, 'success');
      } else {
        showToast('Username atau password tidak cocok.', 'error');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleQuickLogin = (role: 'admin' | 'guru') => {
    const users = db.getUsers();
    const user = users.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      showToast(`Login berhasil sebagai ${role === 'admin' ? 'Administrator' : 'Guru / Petugas'}`, 'success');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 relative overflow-hidden">
      {/* Background ambient shapes */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800">
          {/* Logo & School Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sistem Kedisiplinan Siswa
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              SMK Negeri 1 Nusantara • Portal Akses Guru & Staf
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Username atau Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@sekolah.sch.id"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="submit-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px] disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-center text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Akses Demo Cepat
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="quick-login-admin"
                onClick={() => handleQuickLogin('admin')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/60 transition-colors text-left"
              >
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  Role Admin
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full Akses Sistem
                </span>
              </button>

              <button
                type="button"
                id="quick-login-guru"
                onClick={() => handleQuickLogin('guru')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/60 transition-colors text-left"
              >
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Role Guru
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Pencatatan & Absensi
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Sistem Kedisiplinan Siswa © {new Date().getFullYear()} • Standar Operasional Tata Tertib Sekolah
        </p>
      </div>
    </div>
  );
};
