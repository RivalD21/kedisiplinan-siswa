import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { AttendanceRecord, AttendanceStatus, Student } from '../types';
import { AttendanceBadge } from '../components/Badge';
import {
  CalendarCheck,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Save,
  UserCheck,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { currentUser, showToast } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedClass, setSelectedClass] = useState('X RPL 1');

  // Students in database
  const allStudents = useMemo(() => db.getStudents(), []);

  // Distinct classes
  const classesList = useMemo(() => {
    return Array.from(new Set(allStudents.map((s) => s.kelas))).sort();
  }, [allStudents]);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    return allStudents.filter((s) => s.kelas === selectedClass && s.status === 'Aktif');
  }, [allStudents, selectedClass]);

  // Local attendance state for the table: Map studentId -> AttendanceRecord
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; jam_masuk: string; keterangan: string }>
  >({});

  // Load existing attendance from db for selectedDate
  useEffect(() => {
    const existing = db.getAttendance(selectedDate);
    const map: Record<string, { status: AttendanceStatus; jam_masuk: string; keterangan: string }> = {};

    classStudents.forEach((st) => {
      const found = existing.find((a) => a.student_id === st.id);
      if (found) {
        map[st.id] = {
          status: found.status,
          jam_masuk: found.jam_masuk || '06:55',
          keterangan: found.keterangan || '',
        };
      } else {
        // default status
        map[st.id] = {
          status: 'Hadir',
          jam_masuk: '06:55',
          keterangan: '',
        };
      }
    });

    setAttendanceMap(map);
  }, [selectedDate, selectedClass, classStudents]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        jam_masuk: status === 'Terlambat' ? '07:25' : status === 'Hadir' ? '06:55' : '',
      },
    }));
  };

  const handleKeteranganChange = (studentId: string, keterangan: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        keterangan,
      },
    }));
  };

  const handleJamMasukChange = (studentId: string, jam: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        jam_masuk: jam,
      },
    }));
  };

  // Mark all students as 'Hadir'
  const handleMarkAllHadir = () => {
    const updated: Record<
      string,
      { status: AttendanceStatus; jam_masuk: string; keterangan: string }
    > = {};
    classStudents.forEach((s) => {
      updated[s.id] = {
        status: 'Hadir',
        jam_masuk: '06:55',
        keterangan: '',
      };
    });
    setAttendanceMap(updated);
    showToast(`Semua siswa di kelas ${selectedClass} ditandai Hadir`, 'info');
  };

  // Save all attendance to DB
  const handleSaveAttendance = () => {
    const records = classStudents.map((s) => {
      const data = attendanceMap[s.id] || { status: 'Hadir', jam_masuk: '06:55', keterangan: '' };
      return {
        student_id: s.id,
        tanggal: selectedDate,
        status: data.status,
        jam_masuk: data.jam_masuk,
        keterangan: data.keterangan,
        created_by: currentUser?.nama || 'Petugas Absensi',
      };
    });

    try {
      db.saveAttendanceBulk(records);
      showToast(
        `Absensi kelas ${selectedClass} tanggal ${selectedDate} berhasil disimpan!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan absensi', 'error');
    }
  };

  // Summary counts for current class on current date
  const summaryCounts = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpha = 0;
    let terlambat = 0;

    Object.values(attendanceMap).forEach((val: { status: AttendanceStatus; jam_masuk: string; keterangan: string }) => {
      if (val.status === 'Hadir') hadir++;
      else if (val.status === 'Sakit') sakit++;
      else if (val.status === 'Izin') izin++;
      else if (val.status === 'Alpha') alpha++;
      else if (val.status === 'Terlambat') terlambat++;
    });

    return { hadir, sakit, izin, alpha, terlambat, total: classStudents.length };
  }, [attendanceMap, classStudents]);

  // Export current attendance table to Excel
  const handleExportDailyAttendance = () => {
    const data = classStudents.map((s, idx) => {
      const att = attendanceMap[s.id] || { status: 'Hadir', jam_masuk: '', keterangan: '' };
      return {
        No: idx + 1,
        NIS: s.nis,
        NISN: s.nisn || '',
        'Nama Siswa': s.nama,
        Kelas: s.kelas,
        Tanggal: selectedDate,
        'Status Kehadiran': att.status,
        'Jam Masuk': att.jam_masuk || '-',
        Keterangan: att.keterangan || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Absensi_${selectedClass}`);
    XLSX.writeFile(wb, `Absensi_${selectedClass}_${selectedDate}.xlsx`);
    showToast('Rekap absensi berhasil diekspor ke Excel', 'success');
  };

  return (
    <div id="attendance-page" className="space-y-5 animate-fadeIn pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Presensi & Absensi Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pencatatan kehadiran harian siswa, status dispensasi, izin, dan keterlambatan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tanggal */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              id="attendance-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs bg-transparent border-0 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Kelas Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              id="attendance-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs bg-transparent border-0 text-slate-800 dark:text-slate-200 focus:outline-none font-semibold"
            >
              {classesList.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Export Excel */}
          <button
            onClick={handleExportDailyAttendance}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Siswa</span>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {summaryCounts.total}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">{selectedClass}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
            Hadir
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {summaryCounts.hadir}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Tepat Waktu</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
            Terlambat
          </span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">
            {summaryCounts.terlambat}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Melewati 07:00</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
            Sakit
          </span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400">
            {summaryCounts.sakit}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Surat Dokter</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
            Izin
          </span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {summaryCounts.izin}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Dispensasi</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
            Alpha
          </span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400">
            {summaryCounts.alpha}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Tanpa Kabar</p>
        </div>
      </div>

      {/* Action Bar for Bulk Mark & Save */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllHadir}
            className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
          >
            Tandai Semua Hadir
          </button>
        </div>

        <button
          id="save-attendance-btn"
          onClick={handleSaveAttendance}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Seluruh Absensi</span>
        </button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-3">NIS</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-3 text-center">Status Kehadiran</th>
                <th className="py-3.5 px-3 text-center w-28">Jam Masuk</th>
                <th className="py-3.5 px-4">Keterangan Tambahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada siswa terdaftar di kelas {selectedClass}.
                  </td>
                </tr>
              ) : (
                classStudents.map((student, idx) => {
                  const state = attendanceMap[student.id] || {
                    status: 'Hadir',
                    jam_masuk: '06:55',
                    keterangan: '',
                  };

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 font-medium">
                        {student.nis}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              student.foto ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
                            }
                            alt={student.nama}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <span>{student.nama}</span>
                        </div>
                      </td>

                      {/* Status Pills */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                          {(['Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat'] as AttendanceStatus[]).map(
                            (st) => {
                              const isSelected = state.status === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, st)}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                                    isSelected
                                      ? st === 'Hadir'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : st === 'Sakit'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : st === 'Izin'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : st === 'Alpha'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-amber-600 text-white shadow-xs'
                                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </td>

                      {/* Jam Masuk */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="time"
                          value={state.jam_masuk}
                          disabled={state.status === 'Alpha' || state.status === 'Sakit' || state.status === 'Izin'}
                          onChange={(e) => handleJamMasukChange(student.id, e.target.value)}
                          className="w-24 px-2 py-1 text-center font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 disabled:opacity-40"
                        />
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={state.keterangan}
                          onChange={(e) => handleKeteranganChange(student.id, e.target.value)}
                          placeholder="Keterangan dispensasi / alasan terlambat..."
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
