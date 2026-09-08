import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { DisciplineBadge } from '../components/Badge';
import {
  Users,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { openStudentDetail, theme } = useApp();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(3); // Maret
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Extract unique classes
  const classesList = useMemo(() => {
    const students = db.getStudents();
    return Array.from(new Set(students.map((s) => s.kelas))).sort();
  }, []);

  const stats = useMemo(() => {
    return db.getDashboardStats(selectedYear, selectedMonth, selectedClass || undefined);
  }, [selectedYear, selectedMonth, selectedClass]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const pieColors = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#f43f5e'];

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div id="dashboard-page" className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard Monitoring Kedisiplinan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ikhtisar statistik pelanggaran, kehadiran harian, dan tren kedisiplinan sekolah
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter:</span>
          </div>

          {/* Year Filter */}
          <select
            id="dashboard-filter-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={2026}>Tahun 2026</option>
            <option value={2025}>Tahun 2025</option>
          </select>

          {/* Month Filter */}
          <select
            id="dashboard-filter-month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            id="dashboard-filter-class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Kelas</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                Kelas {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 7 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* Total Siswa */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Siswa</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalSiswa}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Siswa Terdaftar</p>
          </div>
        </div>

        {/* Total Pelanggaran Bulan Ini */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pelanggaran</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats.totalPelanggaranBulanIni}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Kasus Bulan {monthNames[selectedMonth - 1]}</p>
          </div>
        </div>

        {/* Siswa Melanggar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pelaku Kasus</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.uniqueViolatingStudents}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Siswa Terlibat</p>
          </div>
        </div>

        {/* Total Poin Bulan Ini */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Poin</span>
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
              {stats.totalPoinBulanIni}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Poin Akumulasi</p>
          </div>
        </div>

        {/* Hadir Hari Ini */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Hadir Hari Ini</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.jumlahHadirHariIni}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tepat Waktu</p>
          </div>
        </div>

        {/* Tidak Hadir Hari Ini */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tidak Hadir</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats.jumlahTidakHadirHariIni}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Sakit/Izin/Alpha</p>
          </div>
        </div>

        {/* Terlambat Hari Ini */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Terlambat</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.jumlahTerlambatHariIni}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Datang Melewati 07.00</p>
          </div>
        </div>
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Pelanggaran Bulanan (Line/Bar trend) - takes 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Tren Kasus Pelanggaran Bulanan ({selectedYear})
              </h3>
              <p className="text-xs text-slate-400">
                Statistik frekuensi dan beban poin pelanggaran siswa sepanjang tahun
              </p>
            </div>
          </div>

          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.violationsPerMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorJumlah" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="bulan" tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: textColor, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} ${name === 'jumlah' ? 'Kasus' : 'Poin'}`,
                    name === 'jumlah' ? 'Jumlah Pelanggaran' : 'Total Poin',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="jumlah"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorJumlah)"
                  name="jumlah"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik Jenis Pelanggaran (Kategori Paling Sering Terjadi) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Kategori Pelanggaran Terbanyak
            </h3>
            <p className="text-xs text-slate-400">Distribusi jenis pelanggaran yang sering terjadi</p>
          </div>

          <div className="h-68 w-full flex items-center justify-center">
            {stats.violationsByCategory.length === 0 ? (
              <p className="text-xs text-slate-400">Tidak ada data pelanggaran pada periode ini</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.violationsByCategory}
                    dataKey="count"
                    nameKey="kategori"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {stats.violationsByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                    formatter={(value: any) => [`${value} Kejadian`, 'Jumlah']}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Grafik Absensi + Top 10 Siswa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Absensi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Rekapitulasi Absensi Bulan {monthNames[selectedMonth - 1]}
            </h3>
            <p className="text-xs text-slate-400">Komposisi status kehadiran seluruh siswa</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.attendanceSummary}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: textColor, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.attendanceSummary.map((entry, index) => (
                    <Cell key={`cell-bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick numbers below chart */}
          <div className="grid grid-cols-5 gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            {stats.attendanceSummary.map((item) => (
              <div key={item.name} className="px-1">
                <span className="text-[10px] text-slate-400 block truncate">{item.name}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Siswa dengan Poin Pelanggaran Tertinggi (takes 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                Top 10 Siswa Poin Pelanggaran Tertinggi
              </h3>
              <p className="text-xs text-slate-400">
                Daftar siswa yang memerlukan perhatian dan tindak lanjut pembinaan BK
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              Prioritas Pembinaan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="pb-3 px-2 text-center w-12">Rank</th>
                  <th className="pb-3 px-3">Nama Siswa</th>
                  <th className="pb-3 px-3">NIS</th>
                  <th className="pb-3 px-3">Kelas</th>
                  <th className="pb-3 px-3 text-center">Jml Kasus</th>
                  <th className="pb-3 px-3 text-center">Total Poin</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {stats.top10Students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada catatan pelanggaran siswa pada filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  stats.top10Students.map((row) => (
                    <tr
                      key={row.student.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-2.5 px-2 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            row.rank === 1
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-extrabold'
                              : row.rank === 2
                              ? 'bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 font-bold'
                              : row.rank === 3
                              ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              row.foto ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
                            }
                            alt={row.nama}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <button
                            onClick={() => openStudentDetail(row.student.id)}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 text-left truncate max-w-[150px] sm:max-w-xs"
                          >
                            {row.nama}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {row.nis}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                        {row.kelas}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">
                        {row.violationCount}x
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-extrabold text-rose-600 dark:text-rose-400">
                          {row.totalPoints}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <DisciplineBadge level={row.statusInfo.status} />
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => openStudentDetail(row.student.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                        >
                          <span>Detail</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
