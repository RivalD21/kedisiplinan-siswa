import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { ViolationWithDetails, Student, ViolationType } from '../types';
import { SeverityBadge } from '../components/Badge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  Search,
  Calendar,
  Filter,
  Download,
  Eye,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
  X,
  PlusCircle,
  Clock,
  User,
} from 'lucide-react';

export const ViolationsHistory: React.FC = () => {
  const { openStudentDetail, setActiveTab, currentUser, showToast } = useApp();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [deletingViolation, setDeletingViolation] = useState<ViolationWithDetails | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [editingViolation, setEditingViolation] = useState<ViolationWithDetails | null>(null);

  // Edit form state
  const [editKronologi, setEditKronologi] = useState('');
  const [editTindakLanjut, setEditTindakLanjut] = useState('');
  const [editLokasi, setEditLokasi] = useState('');

  // Data
  const [allViolations, setAllViolations] = useState(() => db.getViolations());

  const refreshData = () => {
    setAllViolations(db.getViolations());
  };

  // Distinct classes and categories
  const { classes, categories } = useMemo(() => {
    const clsSet = new Set<string>();
    const catSet = new Set<string>();

    allViolations.forEach((v) => {
      if (v.student?.kelas) clsSet.add(v.student.kelas);
      if (v.violationType?.kategori) catSet.add(v.violationType.kategori);
    });

    return {
      classes: Array.from(clsSet).sort(),
      categories: Array.from(catSet).sort(),
    };
  }, [allViolations]);

  // Filtered violations
  const filteredViolations = useMemo(() => {
    return allViolations.filter((v) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          v.student?.nama.toLowerCase().includes(q) ||
          v.student?.nis.toLowerCase().includes(q) ||
          v.violationType?.nama.toLowerCase().includes(q) ||
          v.lokasi.toLowerCase().includes(q) ||
          v.kronologi.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterClass && v.student?.kelas !== filterClass) return false;
      if (filterCategory && v.violationType?.kategori !== filterCategory) return false;
      if (filterSeverity && v.violationType?.tingkat !== filterSeverity) return false;
      if (startDate && v.tanggal < startDate) return false;
      if (endDate && v.tanggal > endDate) return false;

      return true;
    });
  }, [allViolations, searchQuery, filterClass, filterCategory, filterSeverity, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage) || 1;
  const paginatedViolations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredViolations.slice(start, start + itemsPerPage);
  }, [filteredViolations, currentPage]);

  const handleDeleteConfirm = () => {
    if (!deletingViolation) return;
    try {
      db.deleteViolation(deletingViolation.id);
      showToast('Data pelanggaran berhasil dihapus dan poin siswa disesuaikan', 'success');
      setDeletingViolation(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pelanggaran', 'error');
    }
  };

  const handleOpenEdit = (v: ViolationWithDetails) => {
    setEditingViolation(v);
    setEditKronologi(v.kronologi);
    setEditTindakLanjut(v.tindak_lanjut);
    setEditLokasi(v.lokasi);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingViolation) return;

    try {
      db.updateViolation(editingViolation.id, {
        kronologi: editKronologi.trim(),
        tindak_lanjut: editTindakLanjut.trim(),
        lokasi: editLokasi.trim(),
      });
      showToast('Riwayat pelanggaran berhasil diperbarui', 'success');
      setEditingViolation(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui pelanggaran', 'error');
    }
  };

  const handleExportExcel = () => {
    db.exportViolationsToExcel(filteredViolations);
    showToast(`Berhasil mengekspor ${filteredViolations.length} data riwayat pelanggaran ke Excel`, 'success');
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div id="violations-history-page" className="space-y-5 animate-fadeIn pb-12">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Riwayat Pelanggaran Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar seluruh insiden kedisiplinan tercatat di sekolah ({filteredViolations.length} data ditemukan)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Excel */}
          <button
            id="export-violations-excel-btn"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* Catat Baru */}
          <button
            id="create-violation-btn"
            onClick={() => setActiveTab('input-violation')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Pelanggaran</span>
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-violations-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Siswa, NIS, Pelanggaran, atau Kronologi..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Kelas */}
          <div>
            <select
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

          {/* Kategori */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tingkat Keparahan */}
          <div>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Tingkat</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
            </select>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span className="font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Rentang Tanggal:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
            />
            <span>s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
            />
          </div>

          {(startDate || endDate || filterClass || filterCategory || filterSeverity || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterClass('');
                setFilterCategory('');
                setFilterSeverity('');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-3">Tanggal & Jam</th>
                <th className="py-3.5 px-3">Nama Siswa</th>
                <th className="py-3.5 px-2">Kelas</th>
                <th className="py-3.5 px-3">Jenis Pelanggaran</th>
                <th className="py-3.5 px-3">Kategori</th>
                <th className="py-3.5 px-2 text-center">Poin</th>
                <th className="py-3.5 px-3">Lokasi</th>
                <th className="py-3.5 px-3">Tindak Lanjut</th>
                <th className="py-3.5 px-2 text-center">Bukti</th>
                <th className="py-3.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {paginatedViolations.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Tidak ada catatan riwayat pelanggaran sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                paginatedViolations.map((v, idx) => {
                  const number = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {number}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        <div>{v.tanggal}</div>
                        <div className="text-[10px] text-slate-400 font-normal">pk {v.jam}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              v.student?.foto ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
                            }
                            alt={v.student?.nama}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <button
                              onClick={() => v.student && openStudentDetail(v.student.id)}
                              className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left truncate block max-w-[140px]"
                            >
                              {v.student?.nama || 'Siswa Dihapus'}
                            </button>
                            <span className="text-[10px] text-slate-400 font-mono">
                              NIS: {v.student?.nis}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-200">
                        {v.student?.kelas || '-'}
                      </td>
                      <td className="py-3 px-3 max-w-[180px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 truncate" title={v.violationType?.nama}>
                          {v.violationType?.nama}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate" title={v.kronologi}>
                          {v.kronologi}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 block">
                          {v.violationType?.kategori}
                        </span>
                        <SeverityBadge severity={v.violationType?.tingkat || 'Ringan'} />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md font-bold text-xs bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                          +{v.poin}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-[120px] truncate" title={v.lokasi}>
                        {v.lokasi}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[150px] truncate" title={v.tindak_lanjut}>
                        <div>{v.tindak_lanjut}</div>
                        <div className="text-[10px] text-slate-400">Oleh: {v.petugas_nama}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {v.bukti ? (
                          <button
                            onClick={() => setPreviewPhoto(v.bukti || null)}
                            className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                            title="Lihat Bukti Foto"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {v.student && (
                            <button
                              onClick={() => openStudentDetail(v.student!.id)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Detail Siswa"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(v)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit Catatan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingViolation(v)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Hapus Pelanggaran"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredViolations.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, filteredViolations.length)}
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredViolations.length}
            </span>{' '}
            kejadian
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

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Foto Bukti Pelanggaran
            </h4>
            <img
              src={previewPhoto}
              alt="Bukti Lengkap"
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Catatan Kejadian
              </h3>
              <button
                onClick={() => setEditingViolation(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Lokasi Kejadian
                </label>
                <input
                  type="text"
                  required
                  value={editLokasi}
                  onChange={(e) => setEditLokasi(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Kronologi Kejadian
                </label>
                <textarea
                  rows={3}
                  required
                  value={editKronologi}
                  onChange={(e) => setEditKronologi(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Tindak Lanjut yang Diberikan
                </label>
                <input
                  type="text"
                  required
                  value={editTindakLanjut}
                  onChange={(e) => setEditTindakLanjut(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingViolation(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingViolation)}
        title="Hapus Catatan Pelanggaran"
        message={`Apakah Anda yakin ingin menghapus catatan pelanggaran "${deletingViolation?.violationType?.nama}" untuk siswa "${deletingViolation?.student?.nama}"? Poin pelanggaran siswa akan dikurangi otomatis sebanyak ${deletingViolation?.poin} poin.`}
        confirmLabel="Hapus & Kurangi Poin"
        isDangerous={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingViolation(null)}
      />
    </div>
  );
};
