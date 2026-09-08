import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { DisciplineBadge } from '../components/Badge';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Search,
  Eye,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';

export const MonthlyRecap: React.FC = () => {
  const { openStudentDetail, showToast } = useApp();

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(3); // Maret
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Distinct classes
  const classesList = useMemo(() => {
    const students = db.getStudents();
    return Array.from(new Set(students.map((s) => s.kelas))).sort();
  }, []);

  // Compute monthly recap rows
  const recapData = useMemo(() => {
    const rawRecaps = db.getMonthlyRecaps(selectedMonth, selectedYear, selectedClass || undefined);
    return rawRecaps.map((r) => ({
      ...r,
      monthlyViolations: r.jumlah_pelanggaran,
      monthlyPoints: r.total_poin,
      statusInfo: { status: r.status_pembinaan },
    }));
  }, [selectedYear, selectedMonth, selectedClass]);

  // Filtered by search
  const filteredRecap = useMemo(() => {
    if (!searchQuery.trim()) return recapData;
    const q = searchQuery.toLowerCase().trim();
    return recapData.filter(
      (r) =>
        r.student.nama.toLowerCase().includes(q) ||
        r.student.nis.toLowerCase().includes(q) ||
        r.student.kelas.toLowerCase().includes(q)
    );
  }, [recapData, searchQuery]);

  // Summary aggregation
  const summary = useMemo(() => {
    let totalViolations = 0;
    let totalPoints = 0;
    let totalAlpha = 0;
    let totalTerlambat = 0;

    filteredRecap.forEach((r) => {
      totalViolations += r.monthlyViolations;
      totalPoints += r.monthlyPoints;
      totalAlpha += r.alpha;
      totalTerlambat += r.terlambat;
    });

    return { totalViolations, totalPoints, totalAlpha, totalTerlambat, totalStudents: filteredRecap.length };
  }, [filteredRecap]);

  const handleExportExcel = () => {
    const exportRows = filteredRecap.map((r, idx) => ({
      No: idx + 1,
      NIS: r.student.nis,
      'Nama Siswa': r.student.nama,
      Kelas: r.student.kelas,
      Jurusan: r.student.jurusan,
      'Kasus Bulan Ini': r.monthlyViolations,
      'Poin Bulan Ini': r.monthlyPoints,
      'Total Kumulatif Kasus': r.student.violationCount,
      'Total Kumulatif Poin': r.student.totalPoints,
      Hadir: r.hadir,
      Sakit: r.sakit,
      Izin: r.izin,
      Alpha: r.alpha,
      Terlambat: r.terlambat,
      'Status Kedisiplinan': r.statusInfo.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    const sheetName = `Rekap_${monthNames[selectedMonth - 1]}_${selectedYear}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30));
    XLSX.writeFile(wb, `Rekap_Kedisiplinan_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`);
    showToast('Rekap bulanan berhasil diekspor ke Excel', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="monthly-recap-page" className="space-y-5 animate-fadeIn pb-16">
      {/* Printable Header (Visible on print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wider">
          Pemerintah Provinsi - Dinas Pendidikan
        </h1>
        <h2 className="text-lg font-bold">SMK NEGERI 1 NUSANTARA</h2>
        <p className="text-xs text-slate-600">
          Jl. Pendidikan Karakter Bangsa No. 45, Jakarta | Telp. (021) 7890123
        </p>
        <div className="mt-3 font-bold text-sm uppercase">
          Laporan Rekapitulasi Kedisiplinan & Presensi Siswa
        </div>
        <div className="text-xs">
          Periode: {monthNames[selectedMonth - 1]} {selectedYear} •{' '}
          {selectedClass ? `Kelas ${selectedClass}` : 'Semua Kelas'}
        </div>
      </div>

      {/* Top Header Controls (Hidden on print) */}
      <div className="print:hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Rekap Bulanan Kedisiplinan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Laporan terintegrasi akumulasi pelanggaran, poin sanksi, dan presensi per siswa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          {/* Month */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200"
          >
            {monthNames.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Class */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200"
          >
            <option value="">Semua Kelas</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                Kelas {cls}
              </option>
            ))}
          </select>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* Cetak */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills (Hidden on print) */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Siswa Terekap</span>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {summary.totalStudents}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Siswa Aktif</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
            Kasus Bulan Ini
          </span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400">
            {summary.totalViolations}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Total Kejadian</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 block">
            Poin Bulan Ini
          </span>
          <span className="text-xl font-black text-orange-600 dark:text-orange-400">
            {summary.totalPoints}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Akumulasi Poin</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
            Total Terlambat
          </span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">
            {summary.totalTerlambat}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Kejadian Keterlambatan</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
            Total Alpha
          </span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400">
            {summary.totalAlpha}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">Tanpa Keterangan</p>
        </div>
      </div>

      {/* Search Input (Hidden on print) */}
      <div className="print:hidden relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari siswa dalam rekap..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Main Recap Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-2">Kelas</th>
                <th className="py-3 px-3 text-center bg-rose-50/50 dark:bg-rose-950/20">
                  Pelanggaran (Bulan Ini)
                </th>
                <th className="py-3 px-3 text-center bg-rose-50/50 dark:bg-rose-950/20">
                  Poin (Bulan Ini)
                </th>
                <th className="py-3 px-3 text-center bg-amber-50/40 dark:bg-amber-950/20">
                  Total Kumulatif Poin
                </th>
                <th className="py-3 px-2 text-center">Hadir</th>
                <th className="py-3 px-2 text-center">Sakit</th>
                <th className="py-3 px-2 text-center">Izin</th>
                <th className="py-3 px-2 text-center text-rose-600">Alpha</th>
                <th className="py-3 px-2 text-center text-amber-600">Terlambat</th>
                <th className="py-3 px-3">Status Sanksi</th>
                <th className="py-3 px-2 text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredRecap.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    Tidak ada data rekapitulasi sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredRecap.map((row, idx) => (
                  <tr
                    key={row.student.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 font-medium">
                      {row.student.nis}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <button
                        onClick={() => openStudentDetail(row.student.id)}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 text-left font-bold"
                      >
                        {row.student.nama}
                      </button>
                    </td>
                    <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-200">
                      {row.student.kelas}
                    </td>
                    <td className="py-3 px-3 text-center font-bold bg-rose-50/30 dark:bg-rose-950/10">
                      {row.monthlyViolations > 0 ? (
                        <span className="text-rose-600">{row.monthlyViolations}x</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold bg-rose-50/30 dark:bg-rose-950/10">
                      {row.monthlyPoints > 0 ? (
                        <span className="text-rose-600">+{row.monthlyPoints}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-black bg-amber-50/30 dark:bg-amber-950/10">
                      <span className={row.student.totalPoints > 30 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}>
                        {row.student.totalPoints}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-600 font-medium">
                      {row.hadir}
                    </td>
                    <td className="py-3 px-2 text-center text-blue-600 font-medium">
                      {row.sakit}
                    </td>
                    <td className="py-3 px-2 text-center text-indigo-600 font-medium">
                      {row.izin}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-rose-600">
                      {row.alpha}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-amber-600">
                      {row.terlambat}
                    </td>
                    <td className="py-3 px-3">
                      <DisciplineBadge level={row.statusInfo.status} />
                    </td>
                    <td className="py-3 px-2 text-right print:hidden">
                      <button
                        onClick={() => openStudentDetail(row.student.id)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Detail Siswa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature block for printable official document */}
      <div className="hidden print:grid grid-cols-2 pt-12 text-xs">
        <div>
          <p>Mengetahui,</p>
          <p className="font-bold">Kepala SMK Negeri 1 Nusantara</p>
          <div className="h-20" />
          <p className="font-bold underline">Drs. H. Hendra Wijaya, M.Pd.</p>
          <p>NIP. 19750512 200003 1 004</p>
        </div>
        <div className="text-right">
          <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="font-bold">Koordinator BK / Kedisiplinan</p>
          <div className="h-20" />
          <p className="font-bold underline">Siti Rahmawati, S.Pd., M.Psi.</p>
          <p>NIP. 19820815 200604 2 018</p>
        </div>
      </div>
    </div>
  );
};
