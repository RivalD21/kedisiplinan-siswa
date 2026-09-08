import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { Student, StudentStatus, Gender } from '../types';
import { DisciplineBadge, StudentStatusBadge } from '../components/Badge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileDown,
} from 'lucide-react';

interface ImportRowPreview {
  nis: string;
  nisn: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  kelas: string;
  jurusan: string;
  angkatan: string;
  no_hp: string;
  nama_orang_tua: string;
  no_hp_orang_tua: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export const Students: React.FC = () => {
  const { openStudentDetail, showToast, currentUser } = useApp();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterMajor, setFilterMajor] = useState('');
  const [filterCohort, setFilterCohort] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Aktif');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form fields
  const [formNIS, setFormNIS] = useState('');
  const [formNISN, setFormNISN] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formGender, setFormGender] = useState<Gender>('L');
  const [formKelas, setFormKelas] = useState('X RPL 1');
  const [formJurusan, setFormJurusan] = useState('Rekayasa Perangkat Lunak');
  const [formAngkatan, setFormAngkatan] = useState('2024');
  const [formNoHP, setFormNoHP] = useState('');
  const [formNamaOrtu, setFormNamaOrtu] = useState('');
  const [formNoHPOrtu, setFormNoHPOrtu] = useState('');
  const [formStatus, setFormStatus] = useState<StudentStatus>('Aktif');
  const [formFoto, setFormFoto] = useState('');

  // Import states
  const [importRows, setImportRows] = useState<ImportRowPreview[]>([]);
  const [importReport, setImportReport] = useState<{
    total: number;
    valid: number;
    failed: number;
    duplicate: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Students list from DB
  const [allStudents, setAllStudents] = useState(() => db.getStudents());

  const refreshData = () => {
    setAllStudents(db.getStudents());
  };

  // Lists for filters
  const { classes, majors, cohorts } = useMemo(() => {
    const clsSet = new Set<string>();
    const mjSet = new Set<string>();
    const chSet = new Set<string>();

    allStudents.forEach((s) => {
      if (s.kelas) clsSet.add(s.kelas);
      if (s.jurusan) mjSet.add(s.jurusan);
      if (s.angkatan) chSet.add(s.angkatan);
    });

    return {
      classes: Array.from(clsSet).sort(),
      majors: Array.from(mjSet).sort(),
      cohorts: Array.from(chSet).sort(),
    };
  }, [allStudents]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          s.nama.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          (s.nisn && s.nisn.toLowerCase().includes(q)) ||
          (s.kelas && s.kelas.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filterClass && s.kelas !== filterClass) return false;
      if (filterMajor && s.jurusan !== filterMajor) return false;
      if (filterCohort && s.angkatan !== filterCohort) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });
  }, [allStudents, searchQuery, filterClass, filterMajor, filterCohort, filterStatus]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormNIS('');
    setFormNISN('');
    setFormNama('');
    setFormGender('L');
    setFormKelas(classes[0] || 'X RPL 1');
    setFormJurusan(majors[0] || 'Rekayasa Perangkat Lunak');
    setFormAngkatan('2024');
    setFormNoHP('');
    setFormNamaOrtu('');
    setFormNoHPOrtu('');
    setFormStatus('Aktif');
    setFormFoto('');
    setIsAddEditOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormNIS(student.nis);
    setFormNISN(student.nisn || '');
    setFormNama(student.nama);
    setFormGender(student.jenis_kelamin);
    setFormKelas(student.kelas);
    setFormJurusan(student.jurusan);
    setFormAngkatan(student.angkatan);
    setFormNoHP(student.no_hp || '');
    setFormNamaOrtu(student.nama_orang_tua || '');
    setFormNoHPOrtu(student.no_hp_orang_tua || '');
    setFormStatus(student.status);
    setFormFoto(student.foto || '');
    setIsAddEditOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNIS.trim() || !formNama.trim() || !formKelas.trim()) {
      showToast('Harap lengkapi NIS, Nama, dan Kelas siswa.', 'error');
      return;
    }

    try {
      if (editingStudent) {
        db.updateStudent(editingStudent.id, {
          nis: formNIS.trim(),
          nisn: formNISN.trim(),
          nama: formNama.trim(),
          jenis_kelamin: formGender,
          kelas: formKelas.trim(),
          jurusan: formJurusan.trim(),
          angkatan: formAngkatan.trim(),
          no_hp: formNoHP.trim(),
          nama_orang_tua: formNamaOrtu.trim(),
          no_hp_orang_tua: formNoHPOrtu.trim(),
          status: formStatus,
          foto: formFoto.trim() || undefined,
        });
        showToast('Data siswa berhasil diperbarui', 'success');
      } else {
        db.addStudent({
          nis: formNIS.trim(),
          nisn: formNISN.trim(),
          nama: formNama.trim(),
          jenis_kelamin: formGender,
          kelas: formKelas.trim(),
          jurusan: formJurusan.trim(),
          angkatan: formAngkatan.trim(),
          no_hp: formNoHP.trim(),
          nama_orang_tua: formNamaOrtu.trim(),
          no_hp_orang_tua: formNoHPOrtu.trim(),
          status: formStatus,
          foto: formFoto.trim() || undefined,
        });
        showToast('Siswa baru berhasil ditambahkan', 'success');
      }
      setIsAddEditOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat menyimpan data.', 'error');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingStudent) return;
    try {
      db.deleteStudent(deletingStudent.id);
      showToast(`Data siswa ${deletingStudent.nama} berhasil dihapus`, 'success');
      setDeletingStudent(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus siswa', 'error');
    }
  };

  const handleExportExcel = () => {
    db.exportStudentsToExcel(filteredStudents);
    showToast(`Berhasil mengekspor ${filteredStudents.length} data siswa ke Excel`, 'success');
  };

  const handleDownloadTemplate = () => {
    db.downloadStudentTemplate();
    showToast('Template Excel berhasil diunduh', 'info');
  };

  // Excel Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          showToast('File Excel kosong atau format tidak sesuai!', 'error');
          return;
        }

        const existingNisList = new Set(allStudents.map((s) => s.nis.trim().toLowerCase()));
        const seenInFile = new Set<string>();

        let validCount = 0;
        let failedCount = 0;
        let duplicateCount = 0;

        const parsedRows: ImportRowPreview[] = rawData.map((row, idx) => {
          const nis = String(row['NIS'] || row['nis'] || '').trim();
          const nisn = String(row['NISN'] || row['nisn'] || '').trim();
          const nama = String(row['Nama Lengkap'] || row['Nama'] || row['nama'] || '').trim();
          let jk: 'L' | 'P' = 'L';
          const rawJk = String(row['Jenis Kelamin'] || row['JK'] || '').toUpperCase();
          if (rawJk.startsWith('P') || rawJk === 'PEREMPUAN') jk = 'P';

          const kelas = String(row['Kelas'] || row['kelas'] || '').trim();
          const jurusan = String(row['Jurusan'] || row['jurusan'] || '').trim();
          const angkatan = String(row['Angkatan'] || row['angkatan'] || '2024').trim();
          const no_hp = String(row['No HP'] || row['no_hp'] || '').trim();
          const nama_orang_tua = String(row['Nama Orang Tua'] || row['Orang Tua'] || '').trim();
          const no_hp_orang_tua = String(row['No HP Orang Tua'] || '').trim();

          const errors: string[] = [];
          let isDuplicate = false;

          if (!nis) errors.push('NIS wajib diisi');
          if (!nama) errors.push('Nama wajib diisi');
          if (!kelas) errors.push('Kelas wajib diisi');

          if (nis) {
            const nisLower = nis.toLowerCase();
            if (existingNisList.has(nisLower) || seenInFile.has(nisLower)) {
              isDuplicate = true;
              errors.push(`NIS ${nis} sudah ada di sistem / duplikat dalam file`);
              duplicateCount++;
            }
            seenInFile.add(nisLower);
          }

          const isValid = errors.length === 0 && !isDuplicate;
          if (isValid) {
            validCount++;
          } else if (!isDuplicate) {
            failedCount++;
          }

          return {
            nis,
            nisn,
            nama,
            jenis_kelamin: jk,
            kelas,
            jurusan: jurusan || 'Umum',
            angkatan: angkatan || '2024',
            no_hp,
            nama_orang_tua,
            no_hp_orang_tua,
            isValid,
            isDuplicate,
            errors,
          };
        });

        setImportRows(parsedRows);
        setImportReport({
          total: parsedRows.length,
          valid: validCount,
          failed: failedCount,
          duplicate: duplicateCount,
        });
      } catch (err: any) {
        showToast('Gagal memproses file Excel: ' + (err.message || ''), 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = () => {
    const validRows = importRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('Tidak ada data valid yang dapat diimpor!', 'error');
      return;
    }

    const payload = validRows.map((r) => ({
      nis: r.nis,
      nisn: r.nisn,
      nama: r.nama,
      jenis_kelamin: r.jenis_kelamin,
      kelas: r.kelas,
      jurusan: r.jurusan,
      angkatan: r.angkatan,
      no_hp: r.no_hp,
      nama_orang_tua: r.nama_orang_tua,
      no_hp_orang_tua: r.no_hp_orang_tua,
      status: 'Aktif' as StudentStatus,
    }));

    const result = db.importStudentsBulk(payload);
    showToast(
      `Sukses mengimpor ${result.addedCount} siswa baru! (${result.duplicateCount} duplikat dilewati)`,
      'success'
    );
    setIsImportModalOpen(false);
    setImportRows([]);
    setImportReport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    refreshData();
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div id="students-page" className="space-y-5 animate-fadeIn pb-12">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Database Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Total {filteredStudents.length} siswa ditemukan (dari {allStudents.length} terdaftar)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel */}
          <button
            id="export-students-excel-btn"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* Import Excel */}
          <button
            id="import-students-excel-btn"
            onClick={() => {
              setImportRows([]);
              setImportReport(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          {/* Download Template */}
          <button
            id="download-template-btn"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Download Template Excel"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden md:inline">Template</span>
          </button>

          {/* Tambah Siswa */}
          {isAdmin && (
            <button
              id="add-student-btn"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-students-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Nama, NIS, atau NISN..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Kelas Filter */}
          <div>
            <select
              id="filter-class-select"
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Jurusan Filter */}
          <div>
            <select
              id="filter-major-select"
              value={filterMajor}
              onChange={(e) => {
                setFilterMajor(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Jurusan</option>
              {majors.map((mj) => (
                <option key={mj} value={mj}>
                  {mj}
                </option>
              ))}
            </select>
          </div>

          {/* Angkatan Filter */}
          <div>
            <select
              id="filter-cohort-select"
              value={filterCohort}
              onChange={(e) => {
                setFilterCohort(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Angkatan</option>
              {cohorts.map((ch) => (
                <option key={ch} value={ch}>
                  Angkatan {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="filter-status-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Alumni">Alumni</option>
              <option value="Pindah">Pindah</option>
              <option value="Dikeluarkan">Dikeluarkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="students-table" className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-3">NIS</th>
                <th className="py-3.5 px-3">NISN</th>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-2 text-center">JK</th>
                <th className="py-3.5 px-3">Kelas</th>
                <th className="py-3.5 px-3">Jurusan</th>
                <th className="py-3.5 px-2 text-center">Angkatan</th>
                <th className="py-3.5 px-3">Kontak Siswa</th>
                <th className="py-3.5 px-3">Orang Tua/Wali</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-center">Poin</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    Tidak ada siswa yang sesuai kriteria pencarian atau filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => {
                  const number = (currentPage - 1) * itemsPerPage + idx + 1;
                  const statusInfo = db.getDisciplineStatus(student.totalPoints);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {number}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {student.nis}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {student.nisn || '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              student.foto ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
                            }
                            alt={student.nama}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <button
                            onClick={() => openStudentDetail(student.id)}
                            className="text-left hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
                          >
                            {student.nama}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-500">
                        {student.jenis_kelamin}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {student.kelas}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-[140px] truncate" title={student.jurusan}>
                        {student.jurusan}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-500">
                        {student.angkatan}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {student.no_hp || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="truncate max-w-[120px]" title={student.nama_orang_tua}>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {student.nama_orang_tua || '-'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {student.no_hp_orang_tua}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <StudentStatusBadge status={student.status} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${statusInfo.bgClass} ${statusInfo.colorClass}`}
                        >
                          {student.totalPoints}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Detail */}
                          <button
                            onClick={() => openStudentDetail(student.id)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Lihat Profil Siswa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Data Siswa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {isAdmin && (
                            <button
                              onClick={() => setDeletingStudent(student)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, filteredStudents.length)}
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredStudents.length}
            </span>{' '}
            siswa
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    NIS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNIS}
                    onChange={(e) => setFormNIS(e.target.value)}
                    placeholder="Contoh: 24251001"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    NISN
                  </label>
                  <input
                    type="text"
                    value={formNISN}
                    onChange={(e) => setFormNISN(e.target.value)}
                    placeholder="Contoh: 0071234501"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Nama lengkap sesuai ijazah"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    placeholder="Contoh: X RPL 1"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Angkatan
                  </label>
                  <input
                    type="text"
                    value={formAngkatan}
                    onChange={(e) => setFormAngkatan(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Kompetensi Keahlian / Jurusan
                  </label>
                  <input
                    type="text"
                    value={formJurusan}
                    onChange={(e) => setFormJurusan(e.target.value)}
                    placeholder="Contoh: Rekayasa Perangkat Lunak"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Nomor HP / WA Siswa
                  </label>
                  <input
                    type="text"
                    value={formNoHP}
                    onChange={(e) => setFormNoHP(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={formNamaOrtu}
                    onChange={(e) => setFormNamaOrtu(e.target.value)}
                    placeholder="Nama ayah / ibu / wali"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Nomor HP Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={formNoHPOrtu}
                    onChange={(e) => setFormNoHPOrtu(e.target.value)}
                    placeholder="08129876543"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Status Siswa
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StudentStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Pindah">Pindah</option>
                    <option value="Dikeluarkan">Dikeluarkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    URL Foto Profil (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formFoto}
                    onChange={(e) => setFormFoto(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Excel Modal with Preview and Validation */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Import Data Siswa dari Excel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload file Excel (.xlsx atau .xls). Sistem akan memvalidasi kolom dan mencegah NIS duplikat.
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Upload Zone */}
            <div className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Pilih Dokumen Excel
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Gunakan template kolom standar agar validasi berjalan akurat
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
                  >
                    Unduh Template
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Validation Report Summary */}
            {importReport && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Total Data
                  </span>
                  <span className="text-base font-black text-slate-800 dark:text-slate-100">
                    {importReport.total}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
                    Valid & Siap
                  </span>
                  <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                    {importReport.valid}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-center border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold block">
                    Data Error
                  </span>
                  <span className="text-base font-black text-rose-700 dark:text-rose-300">
                    {importReport.failed}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-center border border-amber-200 dark:border-amber-800">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">
                    NIS Duplikat
                  </span>
                  <span className="text-base font-black text-amber-700 dark:text-amber-300">
                    {importReport.duplicate}
                  </span>
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              {importRows.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Silakan pilih file Excel di atas untuk menampilkan pratinjau data.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">NIS</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-2 text-center">JK</th>
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3">Jurusan</th>
                      <th className="py-2.5 px-3">Catatan Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {importRows.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          row.isValid
                            ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            : 'bg-rose-50/50 dark:bg-rose-950/20'
                        }
                      >
                        <td className="py-2.5 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Bermasalah
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {row.nis || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {row.nama || '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center">{row.jenis_kelamin}</td>
                        <td className="py-2.5 px-3">{row.kelas || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{row.jurusan}</td>
                        <td className="py-2.5 px-3">
                          {row.errors.length > 0 ? (
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                              {row.errors.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              Data siap diimpor
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer confirmation */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                {importRows.filter((r) => r.isValid).length} baris valid akan disimpan ke database
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importRows.filter((r) => r.isValid).length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs"
                >
                  Import {importRows.filter((r) => r.isValid).length} Data Valid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingStudent)}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus data siswa "${deletingStudent?.nama}" (NIS: ${deletingStudent?.nis})? Seluruh riwayat pelanggaran dan absensi siswa ini juga akan dibersihkan.`}
        confirmLabel="Hapus Permanen"
        isDangerous={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStudent(null)}
      />
    </div>
  );
};
