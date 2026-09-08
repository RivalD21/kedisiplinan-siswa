import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { SchoolSettings, User, Role } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  Settings as SettingsIcon,
  School,
  Sliders,
  Users,
  Database,
  Save,
  RotateCcw,
  Download,
  Upload,
  Shield,
  GraduationCap,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { showToast, currentUser } = useApp();

  // Load current settings
  const [settings, setSettings] = useState<SchoolSettings>(() => db.getSettings());
  const [users, setUsers] = useState<User[]>(() => db.getUsers());

  // Active tab inside settings
  const [activeSubTab, setActiveSubTab] = useState<'school' | 'thresholds' | 'users' | 'backup'>('school');

  // School form
  const [namaSekolah, setNamaSekolah] = useState(settings.nama_sekolah);
  const [alamat, setAlamat] = useState(settings.alamat);
  const [telepon, setTelepon] = useState(settings.telepon);
  const [email, setEmail] = useState(settings.email);
  const [kepalaSekolah, setKepalaSekolah] = useState(settings.kepala_sekolah);
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState(settings.nip_kepala_sekolah);
  const [koordinatorBK, setKoordinatorBK] = useState(settings.koordinator_bk);
  const [nipKoordinatorBK, setNipKoordinatorBK] = useState(settings.nip_koordinator_bk);

  // Thresholds form
  const [sp1, setSp1] = useState(settings.threshold_sp1);
  const [sp2, setSp2] = useState(settings.threshold_sp2);
  const [sp3, setSp3] = useState(settings.threshold_sp3);
  const [panggilanOrtu, setPanggilanOrtu] = useState(settings.threshold_panggilan_ortu);

  // User modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('guru');

  // Confirmation dialogs
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = db.saveSettings({
        ...settings,
        nama_sekolah: namaSekolah,
        alamat,
        telepon,
        email,
        kepala_sekolah: kepalaSekolah,
        nip_kepala_sekolah: nipKepalaSekolah,
        koordinator_bk: koordinatorBK,
        nip_koordinator_bk: nipKoordinatorBK,
      });
      setSettings(updated);
      showToast('Informasi profil sekolah berhasil diperbarui', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan profil sekolah', 'error');
    }
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    if (panggilanOrtu >= sp1 || sp1 >= sp2 || sp2 >= sp3) {
      showToast('Urutan batas poin harus logis: Panggilan Ortu < SP1 < SP2 < SP3', 'error');
      return;
    }

    try {
      const updated = db.saveSettings({
        ...settings,
        threshold_panggilan_ortu: Number(panggilanOrtu),
        threshold_sp1: Number(sp1),
        threshold_sp2: Number(sp2),
        threshold_sp3: Number(sp3),
      });
      setSettings(updated);
      showToast('Pengaturan ambang batas poin kedisiplinan berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast('Gagal memperbarui ambang batas poin', 'error');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      showToast('Harap lengkapi semua isian akun baru.', 'error');
      return;
    }

    const currentList = db.getUsers();
    if (currentList.some((u) => u.username.toLowerCase() === newUserUsername.trim().toLowerCase())) {
      showToast('Username sudah dipakai pengguna lain.', 'error');
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      nama: newUserName.trim(),
      email: newUserEmail.trim(),
      username: newUserUsername.trim(),
      password: newUserPassword.trim(),
      role: newUserRole,
      status: 'aktif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar:
        newUserRole === 'admin'
          ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    };

    currentList.push(newUser);
    localStorage.setItem('sks_users', JSON.stringify(currentList));
    setUsers(currentList);
    setIsUserModalOpen(false);

    // Reset inputs
    setNewUserName('');
    setNewUserEmail('');
    setNewUserUsername('');
    setNewUserPassword('');
    showToast(`Pengguna baru ${newUser.nama} berhasil ditambahkan!`, 'success');
  };

  const handleToggleUserStatus = (u: User) => {
    if (u.id === currentUser?.id) {
      showToast('Tidak dapat menonaktifkan akun sendiri!', 'error');
      return;
    }

    const nextStatus = u.status === 'aktif' ? 'nonaktif' : 'aktif';
    const updated = users.map((item) => (item.id === u.id ? { ...item, status: nextStatus as 'aktif' | 'nonaktif' } : item));
    localStorage.setItem('sks_users', JSON.stringify(updated));
    setUsers(updated);
    showToast(`Status pengguna diubah menjadi ${nextStatus}`, 'info');
  };

  // Backup JSON
  const handleBackupData = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      students: db.getStudents(),
      violationTypes: db.getViolationTypes(),
      violations: db.getViolations(),
      attendance: db.getAttendance(),
      settings: db.getSettings(),
      users: db.getUsers(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_SKS_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('File backup database berhasil diunduh', 'success');
  };

  // Restore JSON
  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.students) localStorage.setItem('sks_students', JSON.stringify(parsed.students));
        if (parsed.violationTypes) localStorage.setItem('sks_violation_types', JSON.stringify(parsed.violationTypes));
        if (parsed.violations) localStorage.setItem('sks_violations', JSON.stringify(parsed.violations));
        if (parsed.attendance) localStorage.setItem('sks_attendance', JSON.stringify(parsed.attendance));
        if (parsed.settings) localStorage.setItem('sks_settings', JSON.stringify(parsed.settings));
        if (parsed.users) localStorage.setItem('sks_users', JSON.stringify(parsed.users));

        showToast('Database berhasil dipulihkan dari file backup! Memuat ulang...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err: any) {
        showToast('Gagal memulihkan database: File tidak valid', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Reset to factory defaults
  const handleResetFactory = () => {
    db.resetToFactoryDefaults();
    showToast('Database berhasil di-reset ke data bawaan sekolah! Memuat ulang...', 'info');
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div id="settings-page" className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pengaturan Sistem
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Konfigurasi identitas sekolah, ambang batas pembinaan, akun petugas, dan cadangan data
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('school')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-xs font-bold transition-all relative shrink-0 ${
              activeSubTab === 'school'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Profil Sekolah</span>
          </button>

          <button
            onClick={() => setActiveSubTab('thresholds')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-xs font-bold transition-all relative shrink-0 ${
              activeSubTab === 'thresholds'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Ambang Batas Poin Sanksi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-xs font-bold transition-all relative shrink-0 ${
              activeSubTab === 'users'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen Pengguna</span>
          </button>

          <button
            onClick={() => setActiveSubTab('backup')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-xs font-bold transition-all relative shrink-0 ${
              activeSubTab === 'backup'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup & Reset</span>
          </button>
        </div>

        {/* Tab 1: Profil Sekolah */}
        {activeSubTab === 'school' && (
          <form onSubmit={handleSaveSchoolSettings} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Nama Resmi Sekolah
              </label>
              <input
                type="text"
                required
                value={namaSekolah}
                onChange={(e) => setNamaSekolah(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Alamat Lengkap
              </label>
              <input
                type="text"
                required
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  required
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Email Sekolah
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Nama Kepala Sekolah
                </label>
                <input
                  type="text"
                  required
                  value={kepalaSekolah}
                  onChange={(e) => setKepalaSekolah(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  required
                  value={nipKepalaSekolah}
                  onChange={(e) => setNipKepalaSekolah(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Nama Koordinator BK
                </label>
                <input
                  type="text"
                  required
                  value={koordinatorBK}
                  onChange={(e) => setKoordinatorBK(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  NIP Koordinator BK
                </label>
                <input
                  type="text"
                  required
                  value={nipKoordinatorBK}
                  onChange={(e) => setNipKoordinatorBK(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Ambang Batas Poin Sanksi */}
        {activeSubTab === 'thresholds' && (
          <form onSubmit={handleSaveThresholds} className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
              <p className="font-bold mb-1">Konfigurasi Aturan Kedisiplinan Dinamis</p>
              <p>
                Sistem tidak mengunci batasan poin. Anda dapat mengubah nilai ambang batas sesuai
                dengan SOP tata tertib sekolah masing-masing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Panggilan Orang Tua */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Panggilan Orang Tua / Wali
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                    Warning Awal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Batas poin di mana siswa dan orang tua wajib diundang ke ruang BK untuk mediasi.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    required
                    value={panggilanOrtu}
                    onChange={(e) => setPanggilanOrtu(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500 font-semibold">Poin</span>
                </div>
              </div>

              {/* SP 1 */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Surat Peringatan 1 (SP 1)
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200">
                    Sanksi Tertulis
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Penerbitan surat peringatan tertulis pertama yang ditandatangani kepala sekolah.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    required
                    value={sp1}
                    onChange={(e) => setSp1(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500 font-semibold">Poin</span>
                </div>
              </div>

              {/* SP 2 */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Surat Peringatan 2 (SP 2)
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                    Sanksi Menengah
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Peringatan tingkat dua, perjanjian khusus di atas materai dan pembatasan kegiatan sekolah.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    required
                    value={sp2}
                    onChange={(e) => setSp2(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500 font-semibold">Poin</span>
                </div>
              </div>

              {/* SP 3 */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Surat Peringatan 3 / Skorsing
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white">
                    Sanksi Berat
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tahap pembinaan akhir, skorsing sementara atau dikembalikan kepada orang tua.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    required
                    value={sp3}
                    onChange={(e) => setSp3(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500 font-semibold">Poin</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Aturan Poin</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: User Management */}
        {activeSubTab === 'users' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daftar Petugas & Pengguna Sistem
                </h3>
                <p className="text-xs text-slate-400">
                  Kelola hak akses login untuk guru piket, staf tata usaha, dan administrator
                </p>
              </div>

              <button
                onClick={() => setIsUserModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pengguna</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Pengguna</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status Akun</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              u.avatar ||
                              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={u.nama}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{u.nama}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {u.username}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                          {u.role === 'admin' ? 'Administrator' : 'Guru / Petugas'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            u.status === 'aktif'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            {u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Backup & Reset */}
        {activeSubTab === 'backup' && (
          <div className="p-6 space-y-6">
            {/* Backup Box */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Cadangkan Database (Backup JSON)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Unduh seluruh database (siswa, pelanggaran, absensi, master data) ke dalam format JSON.
                </p>
              </div>
              <button
                onClick={handleBackupData}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Backup</span>
              </button>
            </div>

            {/* Restore Box */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pulihkan Database (Restore JSON)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Unggah file cadangan JSON untuk memulihkan seluruh data aplikasi.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-xl cursor-pointer transition-colors shrink-0">
                <Upload className="w-4 h-4" />
                <span>Pilih File Backup</span>
                <input type="file" accept=".json" onChange={handleRestoreData} className="hidden" />
              </label>
            </div>

            {/* Reset to Factory Defaults */}
            <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Reset ke Data Awal Pabrik
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kembalikan sistem ke data demo awal standar sekolah (20+ siswa dan 15 jenis pelanggaran).
                </p>
              </div>
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Database</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Akun Pengguna Baru
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ahmad Zaki, S.Kom."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="zaki@sekolah.sch.id"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="guru_zaki"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Kata Sandi
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Peran / Hak Akses (Role)
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                >
                  <option value="guru">Guru / Petugas (Input Pelanggaran & Absensi)</option>
                  <option value="admin">Administrator (Akses Penuh Seluruh Sistem)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Reset */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Konfirmasi Reset Database"
        message="PERINGATAN: Seluruh data siswa, catatan pelanggaran baru, dan riwayat absensi yang telah Anda buat akan dihapus dan diganti dengan data seed awal bawaan. Tindakan ini tidak dapat dibatalkan. Lanjutkan?"
        confirmLabel="Reset Sekarang"
        isDangerous={true}
        onConfirm={handleResetFactory}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
