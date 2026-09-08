import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { Student, ViolationType } from '../types';
import { DisciplineBadge, SeverityBadge } from '../components/Badge';
import {
  AlertOctagon,
  Search,
  Calendar,
  Clock,
  MapPin,
  FileText,
  UserCheck,
  Camera,
  UploadCloud,
  CheckCircle2,
  X,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const InputViolation: React.FC = () => {
  const { currentUser, showToast, setActiveTab, openStudentDetail } = useApp();

  // All students and violation types
  const students = useMemo(() => db.getStudents(), []);
  const violationTypes = useMemo(() => db.getViolationTypes().filter((v) => v.status === 'aktif'), []);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);

  // Date and time defaults
  const todayStr = new Date().toISOString().split('T')[0];
  const currentTimeStr = new Date().toTimeString().slice(0, 5);

  const [tanggal, setTanggal] = useState(todayStr);
  const [jam, setJam] = useState(currentTimeStr);
  const [lokasi, setLokasi] = useState('Gerbang Utama Sekolah');
  const [selectedViolationTypeId, setSelectedViolationTypeId] = useState('');
  const [kronologi, setKronologi] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('Teguran lisan dan pencatatan poin pelanggaran');
  const [buktiUrl, setBuktiUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected violation type details
  const currentViolationType = useMemo(() => {
    return violationTypes.find((vt) => vt.id === selectedViolationTypeId) || null;
  }, [violationTypes, selectedViolationTypeId]);

  // Filtered students for picker
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 8);
    const q = studentSearch.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        (s.kelas && s.kelas.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [students, studentSearch]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentPickerOpen(false);
    setStudentSearch('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBuktiUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      showToast('Pilih siswa yang melakukan pelanggaran terlebih dahulu.', 'error');
      return;
    }
    if (!selectedViolationTypeId || !currentViolationType) {
      showToast('Pilih jenis pelanggaran.', 'error');
      return;
    }
    if (!kronologi.trim()) {
      showToast('Harap tuliskan kronologi kejadian pelanggaran.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const newViolation = db.addViolation({
        student_id: selectedStudent.id,
        violation_type_id: currentViolationType.id,
        tanggal,
        jam,
        lokasi,
        poin: currentViolationType.poin,
        kronologi: kronologi.trim(),
        tindak_lanjut: tindakLanjut.trim(),
        bukti: buktiUrl || undefined,
        petugas_id: currentUser?.id || 'admin-1',
        petugas_nama: currentUser?.nama || 'Admin Sistem',
        created_by: currentUser?.nama || 'Admin Sistem',
      });

      showToast(
        `Pelanggaran berhasil dicatat untuk ${selectedStudent.nama} (+${currentViolationType.poin} Poin)`,
        'success'
      );

      // Reset form
      setKronologi('');
      setBuktiUrl('');
      setIsSubmitting(false);

      // Redirect to violations history
      setActiveTab('violations-history');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pelanggaran', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div id="input-violation-page" className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Input Pelanggaran Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Formulir resmi pencatatan pelanggaran tata tertib dan pemberian poin kedisiplinan
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Student Selection */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              1. Pilih Siswa Pelanggar <span className="text-rose-500">*</span>
            </h3>
            {selectedStudent && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setIsStudentPickerOpen(true);
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Ganti Siswa
              </button>
            )}
          </div>

          {!selectedStudent ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setIsStudentPickerOpen(true);
                  }}
                  onFocus={() => setIsStudentPickerOpen(true)}
                  placeholder="Ketik Nama, NIS, atau Kelas untuk mencari siswa..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Autocomplete list */}
              {isStudentPickerOpen && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak menemukan siswa dengan kata kunci "{studentSearch}"
                    </div>
                  ) : (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              s.foto ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
                            }
                            alt={s.nama}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {s.nama}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              NIS: {s.nis} • {s.kelas}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            {s.totalPoints} Poin
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Selected Student Highlight Card */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-3.5">
                <img
                  src={
                    selectedStudent.foto ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={selectedStudent.nama}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedStudent.nama}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    NIS: {selectedStudent.nis} • Kelas: {selectedStudent.kelas} (
                    {selectedStudent.jurusan})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right sm:pr-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Total Poin Saat Ini
                  </span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {selectedStudent.totalPoints} Poin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openStudentDetail(selectedStudent.id)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Lihat Profil
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Violation Detail & Points */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            2. Detail Pelanggaran & Bobot Poin
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal Kejadian <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Jam */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Jam Kejadian <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={jam}
                onChange={(e) => setJam(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lokasi */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Lokasi Kejadian <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Gerbang sekolah / Ruang kelas X / Kantin"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Jenis Pelanggaran */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1.5">
                Jenis Pelanggaran <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedViolationTypeId}
                onChange={(e) => setSelectedViolationTypeId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Jenis Pelanggaran --</option>
                {violationTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    [{vt.kategori}] {vt.nama} (+{vt.poin} Poin)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-filled point box */}
          {currentViolationType && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {currentViolationType.nama}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">
                    Kategori: {currentViolationType.kategori}
                  </span>
                  <SeverityBadge severity={currentViolationType.tingkat} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                  Poin Otomatis
                </span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                  +{currentViolationType.poin} Poin
                </span>
              </div>
            </div>
          )}

          {/* Kronologi Kejadian */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Kronologi Kejadian <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={kronologi}
              onChange={(e) => setKronologi(e.target.value)}
              placeholder="Ceritakan kronologi singkat kejadian pelanggaran secara objektif dan jelas..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tindak Lanjut */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1.5">
              Tindak Lanjut yang Diberikan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              placeholder="Contoh: Teguran lisan, peringatan tertulis, pemanggilan orang tua"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Petugas Pencatat (Automatic) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500">Petugas Pencatat (Akun Saat Ini):</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentUser?.nama} ({currentUser?.role === 'admin' ? 'Administrator' : 'Guru / Petugas'})
            </span>
          </div>
        </div>

        {/* Step 3: Foto Bukti Pelanggaran (Opsional) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-600" />
            3. Upload Bukti Foto Pelanggaran (Opsional)
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {buktiUrl ? (
              <div className="relative">
                <img
                  src={buktiUrl}
                  alt="Preview Bukti"
                  className="w-40 h-28 object-cover rounded-2xl border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setBuktiUrl('')}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex-1 w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Klik atau Drag Foto Bukti Kejadian
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Format JPG, PNG (Maks 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}

            <div className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Foto bukti akan disimpan ke dalam riwayat kartu disiplin siswa dan dapat dicetak sebagai lampiran surat pemanggilan orang tua.
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('violations-history')}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Pelanggaran</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
