import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { DisciplineBadge, AttendanceBadge, SeverityBadge } from '../components/Badge';
import {
  ArrowLeft,
  Phone,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  Printer,
  Shield,
  PlusCircle,
  FileText,
  MapPin,
  Camera,
  GraduationCap,
} from 'lucide-react';

export const StudentDetail: React.FC = () => {
  const { selectedStudentId, setActiveTab } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'violations' | 'attendance'>('violations');

  const student = useMemo(() => {
    if (!selectedStudentId) return null;
    return db.getStudentById(selectedStudentId);
  }, [selectedStudentId]);

  // Violations of this student
  const studentViolations = useMemo(() => {
    if (!selectedStudentId) return [];
    return db.getViolations().filter((v) => v.student_id === selectedStudentId);
  }, [selectedStudentId]);

  // Attendances of this student
  const studentAttendances = useMemo(() => {
    if (!selectedStudentId) return [];
    return db.getAttendance().filter((a) => a.student_id === selectedStudentId);
  }, [selectedStudentId]);

  // Violations this month
  const currentMonthViolations = useMemo(() => {
    const currentMonth = 3; // March
    const currentYear = 2026;
    return studentViolations.filter((v) => {
      const d = new Date(v.tanggal);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
  }, [studentViolations]);

  // Counts of alpha & terlambat
  const attendanceCounts = useMemo(() => {
    let alpha = 0;
    let terlambat = 0;
    let sakit = 0;
    let izin = 0;
    let hadir = 0;

    studentAttendances.forEach((a) => {
      if (a.status === 'Alpha') alpha++;
      else if (a.status === 'Terlambat') terlambat++;
      else if (a.status === 'Sakit') sakit++;
      else if (a.status === 'Izin') izin++;
      else if (a.status === 'Hadir') hadir++;
    });

    return { alpha, terlambat, sakit, izin, hadir, total: studentAttendances.length };
  }, [studentAttendances]);

  if (!student) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
        <p className="text-slate-400 text-sm mb-4">Data siswa tidak ditemukan.</p>
        <button
          onClick={() => setActiveTab('students')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Data Siswa
        </button>
      </div>
    );
  }

  const statusInfo = db.getDisciplineStatus(student.totalPoints);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="student-detail-page" className="space-y-6 animate-fadeIn pb-16">
      {/* Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setActiveTab('students')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Data Siswa</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekam Kedisiplinan</span>
          </button>

          <button
            onClick={() => setActiveTab('input-violation')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Pelanggaran</span>
          </button>
        </div>
      </div>

      {/* Student Profile Card (Identitas & Statistik) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identitas Siswa */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center text-center">
          <div className="relative mb-4">
            <img
              src={
                student.foto ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
              }
              alt={student.nama}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-500/20 shadow-md"
            />
            <span
              className={`absolute bottom-0 right-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                student.status === 'Aktif'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-500 text-white'
              }`}
            >
              {student.status}
            </span>
          </div>

          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
            {student.nama}
          </h3>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
            Kelas {student.kelas} • {student.jurusan}
          </p>

          <div className="mt-3 mb-6">
            <DisciplineBadge level={statusInfo.status} />
          </div>

          {/* Details list */}
          <div className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">NIS</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {student.nis}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">NISN</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {student.nisn || '-'}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Jenis Kelamin</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student.jenis_kelamin === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Angkatan</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student.angkatan}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">No. HP Siswa</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {student.no_hp || '-'}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Orang Tua / Wali</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {student.nama_orang_tua || '-'}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">No. HP Ortu</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {student.no_hp_orang_tua || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Statistik Kedisiplinan & Absensi */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Total Poin */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Poin</span>
                <Shield className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {student.totalPoints}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Batas: {statusInfo.status}</p>
            </div>

            {/* Total Pelanggaran */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Kasus Tercatat</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {student.violationCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Kali Melanggar</p>
            </div>

            {/* Pelanggaran Bulan Ini */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Bulan Ini</span>
                <Calendar className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {currentMonthViolations.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Bulan Maret 2026</p>
            </div>

            {/* Jumlah Alpha */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Jumlah Alpha</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {attendanceCounts.alpha}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Tanpa Keterangan</p>
            </div>

            {/* Jumlah Terlambat */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Terlambat</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {attendanceCounts.terlambat}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Kali Terlambat</p>
            </div>

            {/* Total Kehadiran */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Hadir</span>
                <GraduationCap className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {attendanceCounts.hadir}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sakit: {attendanceCounts.sakit} • Izin: {attendanceCounts.izin}
              </p>
            </div>
          </div>

          {/* Tab Switcher: Riwayat Pelanggaran vs Riwayat Absensi */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="flex items-center gap-4 px-6 pt-4 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveSubTab('violations')}
                className={`pb-3 text-xs font-bold transition-all relative ${
                  activeSubTab === 'violations'
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                Riwayat Pelanggaran ({studentViolations.length})
              </button>
              <button
                onClick={() => setActiveSubTab('attendance')}
                className={`pb-3 text-xs font-bold transition-all relative ${
                  activeSubTab === 'attendance'
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                Riwayat Absensi ({studentAttendances.length})
              </button>
            </div>

            {/* Sub-Tab Content */}
            <div className="p-4 sm:p-6">
              {activeSubTab === 'violations' ? (
                studentViolations.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Siswa ini belum memiliki catatan pelanggaran. Prestasi kedisiplinan sangat baik!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentViolations.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {v.violationType?.nama || 'Pelanggaran Kedisiplinan'}
                              </span>
                              <SeverityBadge severity={v.violationType?.tingkat || 'Ringan'} />
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Kategori: {v.violationType?.kategori} • Tanggal: {v.tanggal} pk {v.jam}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            +{v.poin} Poin
                          </span>
                        </div>

                        {/* Kronologi & Lokasi */}
                        <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            Lokasi: {v.lokasi}
                          </p>
                          <p className="leading-relaxed">{v.kronologi}</p>
                        </div>

                        {/* Tindak Lanjut & Petugas */}
                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Tindak Lanjut:
                            </span>{' '}
                            {v.tindak_lanjut}
                          </div>
                          <div>
                            Pencatat: <span className="font-medium">{v.petugas_nama}</span>
                          </div>
                        </div>

                        {/* Bukti foto jika ada */}
                        {v.bukti && (
                          <div className="pt-2">
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5" />
                              Foto Bukti Kejadian:
                            </span>
                            <img
                              src={v.bukti}
                              alt="Bukti Pelanggaran"
                              className="w-32 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Attendance History */
                studentAttendances.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Belum ada riwayat kehadiran tercatat untuk siswa ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                          <th className="pb-2.5 px-3">Tanggal</th>
                          <th className="pb-2.5 px-3">Status</th>
                          <th className="pb-2.5 px-3">Jam Masuk</th>
                          <th className="pb-2.5 px-3">Keterangan</th>
                          <th className="pb-2.5 px-3">Petugas Pencatat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {studentAttendances.map((att) => (
                          <tr key={att.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                              {att.tanggal}
                            </td>
                            <td className="py-2.5 px-3">
                              <AttendanceBadge status={att.status} />
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {att.jam_masuk || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {att.keterangan || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                              {att.created_by}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
