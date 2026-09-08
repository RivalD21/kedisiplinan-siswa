import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { Student } from '../types';
import {
  Sun,
  Moon,
  Search,
  LogOut,
  Menu,
  Shield,
  GraduationCap,
  ChevronDown,
  UserCheck,
  X,
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    currentUser,
    setCurrentUser,
    toggleSidebar,
    setIsMobileDrawerOpen,
    openStudentDetail,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Student & { totalPoints: number })[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close search and user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const q = query.toLowerCase().trim();
    const students = db.getStudents();
    const matches = students
      .filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          (s.nisn && s.nisn.toLowerCase().includes(q))
      )
      .slice(0, 6);

    setSearchResults(matches);
    setIsSearchOpen(true);
  };

  const handleSelectStudent = (studentId: string) => {
    openStudentDetail(studentId);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleSwitchRole = (role: 'admin' | 'guru') => {
    const users = db.getUsers();
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      showToast(`Beralih peran ke ${role === 'admin' ? 'Administrator' : 'Guru / Petugas'}`, 'info');
      setUserDropdownOpen(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Berhasil keluar dari sistem', 'info');
  };

  return (
    <header
      id="app-topbar"
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200"
    >
      {/* Left side: Hamburger + App Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              setIsMobileDrawerOpen(true);
            } else {
              toggleSidebar();
            }
          }}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Sistem Kedisiplinan Siswa
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              SMK Negeri 1 Nusantara
            </p>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
            placeholder="Cari siswa via Nama, NIS, atau NISN..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div
            id="global-search-results"
            className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 max-h-80 overflow-y-auto z-50"
          >
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Tidak ada siswa yang cocok dengan "{searchQuery}"
              </div>
            ) : (
              <div>
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Hasil Siswa ({searchResults.length})
                </div>
                {searchResults.map((student) => {
                  const statusInfo = db.getDisciplineStatus(student.totalPoints);
                  return (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            student.foto ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={student.nama}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {student.nama}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            NIS: {student.nis} • {student.kelas}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md ${statusInfo.bgClass} ${statusInfo.colorClass}`}
                        >
                          {student.totalPoints} Poin
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Theme toggle, Role Switcher, User profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme Toggle Button */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Quick Role Switcher Pill for rapid testing */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => handleSwitchRole('admin')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentUser?.role === 'admin'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => handleSwitchRole('guru')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentUser?.role === 'guru'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Guru
          </button>
        </div>

        {/* User Profile dropdown */}
        <div ref={userRef} className="relative">
          <button
            id="user-profile-btn"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser?.nama}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {currentUser?.nama?.split(',')[0]}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400">
                  {currentUser?.role === 'admin' ? 'Admin' : 'Guru / Petugas'}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* User dropdown menu */}
          {userDropdownOpen && (
            <div
              id="user-dropdown-menu"
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fadeIn"
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser?.nama}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {currentUser?.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {currentUser?.role === 'admin' ? (
                    <Shield className="w-3 h-3" />
                  ) : (
                    <GraduationCap className="w-3 h-3" />
                  )}
                  Role: {currentUser?.role === 'admin' ? 'Administrator' : 'Guru / Petugas'}
                </div>
              </div>

              <div className="px-2 py-1">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400">
                  Ganti Akun Demo
                </div>
                <button
                  onClick={() => handleSwitchRole('admin')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                >
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span>Masuk sebagai Admin</span>
                </button>
                <button
                  onClick={() => handleSwitchRole('guru')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                  <span>Masuk sebagai Guru</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 px-2 pt-1">
                <button
                  id="topbar-logout-btn"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Aplikasi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
