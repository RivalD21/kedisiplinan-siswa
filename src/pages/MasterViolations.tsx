import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';
import { ViolationType, ViolationSeverity } from '../types';
import { SeverityBadge } from '../components/Badge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const MasterViolations: React.FC = () => {
  const { currentUser, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingType, setEditingType] = useState<ViolationType | null>(null);
  const [deletingType, setDeletingType] = useState<ViolationType | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Form inputs
  const [formNama, setFormNama] = useState('');
  const [formKategori, setFormKategori] = useState('Kerapian');
  const [formPoin, setFormPoin] = useState(10);
  const [formTingkat, setFormTingkat] = useState<ViolationSeverity>('Ringan');
  const [formStatus, setFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');

  // List from DB
  const [allTypes, setAllTypes] = useState(() => db.getViolationTypes());

  const refreshData = () => {
    setAllTypes(db.getViolationTypes());
  };

  // Distinct categories
  const categoriesList = useMemo(() => {
    return Array.from(new Set(allTypes.map((t) => t.kategori))).sort();
  }, [allTypes]);

  // Filtered types
  const filteredTypes = useMemo(() => {
    return allTypes.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          t.nama.toLowerCase().includes(q) ||
          t.kategori.toLowerCase().includes(q) ||
          t.tingkat.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterCategory && t.kategori !== filterCategory) return false;
      if (filterSeverity && t.tingkat !== filterSeverity) return false;
      return true;
    });
  }, [allTypes, searchQuery, filterCategory, filterSeverity]);

  const handleOpenAdd = () => {
    setEditingType(null);
    setFormNama('');
    setFormKategori(categoriesList[0] || 'Kerapian');
    setFormPoin(10);
    setFormTingkat('Ringan');
    setFormStatus('aktif');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (vt: ViolationType) => {
    setEditingType(vt);
    setFormNama(vt.nama);
    setFormKategori(vt.kategori);
    setFormPoin(vt.poin);
    setFormTingkat(vt.tingkat);
    setFormStatus(vt.status);
    setIsAddEditOpen(true);
  };

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formKategori.trim()) {
      showToast('Nama pelanggaran dan kategori wajib diisi.', 'error');
      return;
    }

    try {
      if (editingType) {
        db.updateViolationType(editingType.id, {
          nama: formNama.trim(),
          kategori: formKategori.trim() as any,
          poin: Number(formPoin),
          tingkat: formTingkat,
          status: formStatus,
        });
        showToast('Jenis pelanggaran berhasil diperbarui', 'success');
      } else {
        const genKode = `PEL-${Math.floor(100 + Math.random() * 900)}`;
        db.addViolationType({
          kode: genKode,
          nama: formNama.trim(),
          kategori: formKategori.trim() as any,
          poin: Number(formPoin),
          tingkat: formTingkat,
          keterangan: formNama.trim(),
          status: formStatus,
        });
        showToast('Jenis pelanggaran baru berhasil ditambahkan', 'success');
      }
      setIsAddEditOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat menyimpan master data', 'error');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingType) return;
    try {
      db.deleteViolationType(deletingType.id);
      showToast(`Jenis pelanggaran "${deletingType.nama}" berhasil dihapus`, 'success');
      setDeletingType(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus jenis pelanggaran', 'error');
    }
  };

  const handleToggleStatus = (vt: ViolationType) => {
    const nextStatus = vt.status === 'aktif' ? 'nonaktif' : 'aktif';
    db.updateViolationType(vt.id, { status: nextStatus });
    showToast(`Status pelanggaran diubah menjadi ${nextStatus}`, 'info');
    refreshData();
  };

  const handleExportExcel = () => {
    const data = filteredTypes.map((t, idx) => ({
      No: idx + 1,
      ID: t.id,
      'Nama Pelanggaran': t.nama,
      Kategori: t.kategori,
      Poin: t.poin,
      Tingkat: t.tingkat,
      Status: t.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Pelanggaran');
    XLSX.writeFile(wb, `Master_Pelanggaran_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Master data pelanggaran berhasil diekspor ke Excel', 'success');
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div id="master-violations-page" className="space-y-5 animate-fadeIn pb-16">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Master Data Pelanggaran
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Buku pedoman tata tertib resmi, klasifikasi bobot sanksi, dan poin kedisiplinan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* Add New Violation Type */}
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Master Pelanggaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pelanggaran / kata kunci..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Category */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Kategori</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Severity */}
          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Tingkat Keparahan</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Violation Types */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-4">Nama Pelanggaran</th>
                <th className="py-3.5 px-3">Kategori</th>
                <th className="py-3.5 px-3 text-center">Bobot Poin</th>
                <th className="py-3.5 px-3">Tingkat</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada jenis pelanggaran sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredTypes.map((vt, idx) => (
                  <tr
                    key={vt.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      vt.status === 'nonaktif' ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {vt.nama}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                      {vt.kategori}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg font-black text-xs bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                        +{vt.poin} Poin
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <SeverityBadge severity={vt.tingkat} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => isAdmin && handleToggleStatus(vt)}
                        disabled={!isAdmin}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                          vt.status === 'aktif'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {vt.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(vt)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Jenis Pelanggaran"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingType(vt)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Hapus Master"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Master Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingType ? 'Edit Master Pelanggaran' : 'Tambah Jenis Pelanggaran Baru'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Nama Pelanggaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Datang terlambat lebih dari 15 menit"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Kategori Pelanggaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    placeholder="Kerapian / Ketertiban / Keterlambatan"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Bobot Poin Sanksi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={200}
                    value={formPoin}
                    onChange={(e) => setFormPoin(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Tingkat Pelanggaran
                  </label>
                  <select
                    value={formTingkat}
                    onChange={(e) => setFormTingkat(e.target.value as ViolationSeverity)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Ringan">Ringan (5 - 15 Poin)</option>
                    <option value="Sedang">Sedang (20 - 45 Poin)</option>
                    <option value="Berat">Berat (50+ Poin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'aktif' | 'nonaktif')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="aktif">Aktif (Dapat Dipilih)</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Simpan Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingType)}
        title="Hapus Jenis Pelanggaran"
        message={`Apakah Anda yakin ingin menghapus jenis pelanggaran "${deletingType?.nama}"? Tindakan ini tidak akan menghapus riwayat pelanggaran masa lalu yang telah dicatat.`}
        confirmLabel="Hapus Master Data"
        isDangerous={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingType(null)}
      />
    </div>
  );
};
