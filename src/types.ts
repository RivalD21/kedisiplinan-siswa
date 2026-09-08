export type UserRole = 'admin' | 'guru';
export type Role = UserRole;

export interface User {
  id: string;
  nama: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'aktif' | 'nonaktif';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export type Gender = 'L' | 'P';

export type StudentStatus = 'Aktif' | 'Alumni' | 'Pindah' | 'Dikeluarkan';

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  jenis_kelamin: Gender;
  kelas: string;
  jurusan: string;
  angkatan: string;
  no_hp: string;
  nama_orang_tua: string;
  no_hp_orang_tua: string;
  status: StudentStatus;
  foto?: string;
  total_poin?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export type ViolationCategory =
  | 'Kehadiran'
  | 'Seragam'
  | 'Sikap'
  | 'Kebersihan'
  | 'Akademik'
  | 'Ketertiban'
  | 'Merokok'
  | 'Perkelahian'
  | 'Barang Terlarang'
  | 'Lainnya';

export type ViolationSeverity = 'Ringan' | 'Sedang' | 'Berat';

export interface ViolationType {
  id: string;
  kode: string;
  nama: string;
  kategori: ViolationCategory;
  tingkat: ViolationSeverity;
  poin: number;
  keterangan: string;
  status: 'aktif' | 'nonaktif';
}

export interface Violation {
  id: string;
  student_id: string;
  violation_type_id: string;
  tanggal: string; // YYYY-MM-DD
  jam: string; // HH:mm
  lokasi: string;
  kronologi: string;
  poin: number;
  petugas_id: string;
  petugas_nama: string;
  tindak_lanjut: string;
  bukti?: string; // base64 or url
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export type ViolationWithDetails = Violation & {
  student?: Student;
  violationType?: ViolationType;
};

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Terlambat';

export interface Attendance {
  id: string;
  student_id: string;
  tanggal: string; // YYYY-MM-DD
  status: AttendanceStatus;
  jam_masuk?: string; // HH:mm
  keterangan?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type AttendanceRecord = Attendance;

export type DisciplineLevel =
  | 'Aman'
  | 'Perhatian'
  | 'Pembinaan'
  | 'Panggilan Orang Tua'
  | 'Penanganan Khusus';

export interface PointThresholds {
  amanMax: number; // e.g. 10
  perhatianMax: number; // e.g. 25
  pembinaanMax: number; // e.g. 50
  panggilanOrangTuaMax: number; // e.g. 75
}

export interface SchoolSettings {
  schoolName: string;
  schoolNPSN: string;
  schoolAddress: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  pointThresholds: PointThresholds;
  // Indonesian-named aliases / extra fields
  nama_sekolah?: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  kepala_sekolah?: string;
  nip_kepala_sekolah?: string;
  koordinator_bk?: string;
  nip_koordinator_bk?: string;
  threshold_panggilan_ortu?: number;
  threshold_sp1?: number;
  threshold_sp2?: number;
  threshold_sp3?: number;
}

export interface MonthlyRecap {
  id: string;
  student_id: string;
  bulan: number; // 1-12
  tahun: number; // e.g. 2026
  jumlah_pelanggaran: number;
  total_poin: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  terlambat: number;
  status_pembinaan: DisciplineLevel;
  created_at: string;
  updated_at: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
