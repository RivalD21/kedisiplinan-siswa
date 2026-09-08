import * as XLSX from 'xlsx';
import {
  Student,
  ViolationType,
  Violation,
  Attendance,
  SchoolSettings,
  User,
  MonthlyRecap,
  DisciplineLevel,
  PointThresholds,
} from '../types';
import {
  initialStudents,
  initialViolationTypes,
  initialViolations,
  initialSettings,
  initialUsers,
  generateSeedAttendance,
} from './seedData';

const STORAGE_KEYS = {
  STUDENTS: 'sks_students_v1',
  VIOLATION_TYPES: 'sks_violation_types_v1',
  VIOLATIONS: 'sks_violations_v1',
  ATTENDANCE: 'sks_attendance_v1',
  SETTINGS: 'sks_settings_v1',
  USERS: 'sks_users_v1',
  MONTHLY_RECAPS: 'sks_monthly_recaps_v1',
  CURRENT_USER: 'sks_current_user_v1',
  THEME: 'sks_theme_preference_v1',
};

class DatabaseService {
  private students: Student[] = [];
  private violationTypes: ViolationType[] = [];
  private violations: Violation[] = [];
  private attendances: Attendance[] = [];
  private settings: SchoolSettings = initialSettings;
  private users: User[] = [];
  private monthlyRecaps: MonthlyRecap[] = [];
  private currentUser: User | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private init() {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.settings = storedSettings ? JSON.parse(storedSettings) : initialSettings;

      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : initialUsers;

      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      this.currentUser = storedUser ? JSON.parse(storedUser) : this.users[0];

      const storedViolationTypes = localStorage.getItem(STORAGE_KEYS.VIOLATION_TYPES);
      this.violationTypes = storedViolationTypes ? JSON.parse(storedViolationTypes) : initialViolationTypes;

      const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      this.students = storedStudents ? JSON.parse(storedStudents) : initialStudents;

      const storedViolations = localStorage.getItem(STORAGE_KEYS.VIOLATIONS);
      this.violations = storedViolations ? JSON.parse(storedViolations) : initialViolations;

      const storedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      this.attendances = storedAttendance ? JSON.parse(storedAttendance) : generateSeedAttendance();

      const storedRecaps = localStorage.getItem(STORAGE_KEYS.MONTHLY_RECAPS);
      this.monthlyRecaps = storedRecaps ? JSON.parse(storedRecaps) : [];

      this.saveAll();
    } catch (e) {
      console.error('Error initializing database:', e);
      this.resetToInitial();
    }
  }

  public resetToInitial() {
    this.settings = initialSettings;
    this.users = initialUsers;
    this.currentUser = initialUsers[0];
    this.violationTypes = initialViolationTypes;
    this.students = initialStudents;
    this.violations = initialViolations;
    this.attendances = generateSeedAttendance();
    this.monthlyRecaps = [];
    this.saveAll();
    this.notify();
  }

  private saveAll() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    if (this.currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    }
    localStorage.setItem(STORAGE_KEYS.VIOLATION_TYPES, JSON.stringify(this.violationTypes));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(this.violations));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(this.attendances));
    localStorage.setItem(STORAGE_KEYS.MONTHLY_RECAPS, JSON.stringify(this.monthlyRecaps));
  }

  // --- Auth & User ---
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public addUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    this.notify();
    return newUser;
  }

  // --- Settings ---
  public getSettings(): SchoolSettings {
    return {
      ...this.settings,
      nama_sekolah: this.settings.nama_sekolah || this.settings.schoolName,
      alamat: this.settings.alamat || this.settings.schoolAddress,
      telepon: this.settings.telepon || '(021) 7890123',
      email: this.settings.email || 'info@smkn1nusantara.sch.id',
      kepala_sekolah: this.settings.kepala_sekolah || 'Drs. H. Hendra Wijaya, M.Pd.',
      nip_kepala_sekolah: this.settings.nip_kepala_sekolah || '19750512 200003 1 004',
      koordinator_bk: this.settings.koordinator_bk || 'Siti Rahmawati, S.Pd., M.Psi.',
      nip_koordinator_bk: this.settings.nip_koordinator_bk || '19820815 200604 2 018',
      threshold_panggilan_ortu: this.settings.threshold_panggilan_ortu || this.settings.pointThresholds?.panggilanOrangTuaMax || 30,
      threshold_sp1: this.settings.threshold_sp1 || this.settings.pointThresholds?.pembinaanMax || 50,
      threshold_sp2: this.settings.threshold_sp2 || 75,
      threshold_sp3: this.settings.threshold_sp3 || 100,
    };
  }

  public updateSettings(newSettings: SchoolSettings) {
    this.settings = newSettings;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    this.notify();
  }

  public saveSettings(newSettings: Partial<SchoolSettings>): SchoolSettings {
    this.settings = {
      ...this.settings,
      ...newSettings,
      schoolName: newSettings.nama_sekolah || newSettings.schoolName || this.settings.schoolName,
      schoolAddress: newSettings.alamat || newSettings.schoolAddress || this.settings.schoolAddress,
      pointThresholds: {
        ...this.settings.pointThresholds,
        panggilanOrangTuaMax: newSettings.threshold_panggilan_ortu ?? this.settings.pointThresholds.panggilanOrangTuaMax,
        pembinaanMax: newSettings.threshold_sp1 ?? this.settings.pointThresholds.pembinaanMax,
      },
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    this.notify();
    return this.getSettings();
  }

  public resetToFactoryDefaults() {
    this.resetToInitial();
  }

  // --- Discipline Status Logic based on Settings ---
  public getDisciplineStatus(totalPoints: number, customThresholds?: PointThresholds): {
    status: DisciplineLevel;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  } {
    const t = customThresholds || this.settings.pointThresholds;

    if (totalPoints <= t.amanMax) {
      return {
        status: 'Aman',
        colorClass: 'text-emerald-700 dark:text-emerald-300',
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderClass: 'border-emerald-200 dark:border-emerald-800',
      };
    } else if (totalPoints <= t.perhatianMax) {
      return {
        status: 'Perhatian',
        colorClass: 'text-sky-700 dark:text-sky-300',
        bgClass: 'bg-sky-50 dark:bg-sky-950/40',
        borderClass: 'border-sky-200 dark:border-sky-800',
      };
    } else if (totalPoints <= t.pembinaanMax) {
      return {
        status: 'Pembinaan',
        colorClass: 'text-amber-700 dark:text-amber-300',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
        borderClass: 'border-amber-200 dark:border-amber-800',
      };
    } else if (totalPoints <= t.panggilanOrangTuaMax) {
      return {
        status: 'Panggilan Orang Tua',
        colorClass: 'text-orange-700 dark:text-orange-300',
        bgClass: 'bg-orange-50 dark:bg-orange-950/40',
        borderClass: 'border-orange-200 dark:border-orange-800',
      };
    } else {
      return {
        status: 'Penanganan Khusus',
        colorClass: 'text-rose-700 dark:text-rose-300',
        bgClass: 'bg-rose-50 dark:bg-rose-950/40',
        borderClass: 'border-rose-200 dark:border-rose-800',
      };
    }
  }

  // --- Students ---
  public getStudents(): (Student & { totalPoints: number; violationCount: number })[] {
    return this.students.map((student) => {
      const studentViolations = this.violations.filter((v) => v.student_id === student.id);
      const totalPoints = studentViolations.reduce((sum, v) => sum + (v.poin || 0), 0);
      return {
        ...student,
        totalPoints,
        violationCount: studentViolations.length,
      };
    });
  }

  public getStudentById(id: string): (Student & { totalPoints: number; violationCount: number }) | null {
    const student = this.students.find((s) => s.id === id);
    if (!student) return null;
    const studentViolations = this.violations.filter((v) => v.student_id === student.id);
    const totalPoints = studentViolations.reduce((sum, v) => sum + (v.poin || 0), 0);
    return {
      ...student,
      totalPoints,
      violationCount: studentViolations.length,
    };
  }

  public getStudentByNIS(nis: string): Student | undefined {
    return this.students.find((s) => s.nis.trim() === nis.trim());
  }

  public addStudent(studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Student {
    // Check unique NIS
    if (this.students.some((s) => s.nis.trim().toLowerCase() === studentData.nis.trim().toLowerCase())) {
      throw new Error(`NIS ${studentData.nis} sudah terdaftar dalam sistem!`);
    }
    // Check unique NISN if provided
    if (
      studentData.nisn &&
      this.students.some((s) => s.nisn.trim().toLowerCase() === studentData.nisn.trim().toLowerCase())
    ) {
      throw new Error(`NISN ${studentData.nisn} sudah terdaftar dalam sistem!`);
    }

    const now = new Date().toISOString();
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: now,
      updated_at: now,
      created_by: this.currentUser?.nama || 'Petugas',
    };

    this.students.unshift(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
    this.notify();
    return newStudent;
  }

  public updateStudent(id: string, updateData: Partial<Student>): Student {
    const index = this.students.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Siswa tidak ditemukan');

    // Check unique NIS if changed
    if (updateData.nis) {
      const duplicate = this.students.find(
        (s) => s.id !== id && s.nis.trim().toLowerCase() === updateData.nis!.trim().toLowerCase()
      );
      if (duplicate) throw new Error(`NIS ${updateData.nis} sudah digunakan oleh siswa lain!`);
    }

    // Check unique NISN if changed
    if (updateData.nisn) {
      const duplicate = this.students.find(
        (s) => s.id !== id && s.nisn.trim().toLowerCase() === updateData.nisn!.trim().toLowerCase()
      );
      if (duplicate) throw new Error(`NISN ${updateData.nisn} sudah digunakan oleh siswa lain!`);
    }

    this.students[index] = {
      ...this.students[index],
      ...updateData,
      updated_at: new Date().toISOString(),
      updated_by: this.currentUser?.nama || 'Petugas',
    };

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
    this.notify();
    return this.students[index];
  }

  public deleteStudent(id: string) {
    this.students = this.students.filter((s) => s.id !== id);
    // Also cleanup student's violations and attendances
    this.violations = this.violations.filter((v) => v.student_id !== id);
    this.attendances = this.attendances.filter((a) => a.student_id !== id);
    this.monthlyRecaps = this.monthlyRecaps.filter((m) => m.student_id !== id);

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(this.violations));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(this.attendances));
    localStorage.setItem(STORAGE_KEYS.MONTHLY_RECAPS, JSON.stringify(this.monthlyRecaps));
    this.notify();
  }

  // Bulk import students from validated rows
  public importStudentsBulk(
    newStudents: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]
  ): { addedCount: number; duplicateCount: number } {
    let addedCount = 0;
    let duplicateCount = 0;
    const now = new Date().toISOString();
    const creator = this.currentUser?.nama || 'Admin Import';

    for (const item of newStudents) {
      const exists = this.students.some(
        (s) => s.nis.trim().toLowerCase() === item.nis.trim().toLowerCase()
      );
      if (exists) {
        duplicateCount++;
        continue;
      }

      this.students.push({
        ...item,
        id: `std-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        created_at: now,
        updated_at: now,
        created_by: creator,
      });
      addedCount++;
    }

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
    this.notify();
    return { addedCount, duplicateCount };
  }

  // --- Violation Types ---
  public getViolationTypes(): ViolationType[] {
    return [...this.violationTypes];
  }

  public addViolationType(data: Omit<ViolationType, 'id'>): ViolationType {
    if (this.violationTypes.some((vt) => vt.kode.toLowerCase() === data.kode.toLowerCase())) {
      throw new Error(`Kode pelanggaran ${data.kode} sudah digunakan!`);
    }

    const newVt: ViolationType = {
      ...data,
      id: `vt-${Date.now()}`,
    };

    this.violationTypes.push(newVt);
    localStorage.setItem(STORAGE_KEYS.VIOLATION_TYPES, JSON.stringify(this.violationTypes));
    this.notify();
    return newVt;
  }

  public updateViolationType(id: string, data: Partial<ViolationType>): ViolationType {
    const idx = this.violationTypes.findIndex((vt) => vt.id === id);
    if (idx === -1) throw new Error('Jenis pelanggaran tidak ditemukan');

    if (data.kode) {
      const exists = this.violationTypes.find((vt) => vt.id !== id && vt.kode.toLowerCase() === data.kode!.toLowerCase());
      if (exists) throw new Error(`Kode pelanggaran ${data.kode} sudah digunakan!`);
    }

    this.violationTypes[idx] = {
      ...this.violationTypes[idx],
      ...data,
    };

    localStorage.setItem(STORAGE_KEYS.VIOLATION_TYPES, JSON.stringify(this.violationTypes));
    this.notify();
    return this.violationTypes[idx];
  }

  public deleteViolationType(id: string) {
    // Check if being used in violations
    const used = this.violations.some((v) => v.violation_type_id === id);
    if (used) {
      throw new Error('Jenis pelanggaran ini telah tercatat dalam riwayat siswa dan tidak dapat dihapus! Anda dapat menonaktifkannya.');
    }

    this.violationTypes = this.violationTypes.filter((vt) => vt.id !== id);
    localStorage.setItem(STORAGE_KEYS.VIOLATION_TYPES, JSON.stringify(this.violationTypes));
    this.notify();
  }

  // --- Violations ---
  public getViolations(): (Violation & {
    student?: Student;
    violationType?: ViolationType;
  })[] {
    return this.violations.map((v) => ({
      ...v,
      student: this.students.find((s) => s.id === v.student_id),
      violationType: this.violationTypes.find((vt) => vt.id === v.violation_type_id),
    }));
  }

  public addViolation(data: Omit<Violation, 'id' | 'created_at' | 'updated_at'>): Violation {
    const now = new Date().toISOString();
    const newViolation: Violation = {
      ...data,
      id: `vio-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: now,
      updated_at: now,
      created_by: this.currentUser?.nama || data.petugas_nama || 'Petugas',
    };

    this.violations.unshift(newViolation);
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(this.violations));
    this.notify();
    return newViolation;
  }

  public updateViolation(id: string, data: Partial<Violation>): Violation {
    const idx = this.violations.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Data pelanggaran tidak ditemukan');

    this.violations[idx] = {
      ...this.violations[idx],
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: this.currentUser?.nama || 'Petugas',
    };

    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(this.violations));
    this.notify();
    return this.violations[idx];
  }

  public deleteViolation(id: string) {
    this.violations = this.violations.filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(this.violations));
    this.notify();
  }

  // --- Attendance ---
  public getAttendance(tanggal?: string, kelas?: string): (Attendance & { student?: Student })[] {
    let list = this.attendances;

    if (tanggal) {
      list = list.filter((a) => a.tanggal === tanggal);
    }

    const mapped = list.map((a) => ({
      ...a,
      student: this.students.find((s) => s.id === a.student_id),
    }));

    if (kelas) {
      return mapped.filter((item) => item.student?.kelas === kelas);
    }

    return mapped;
  }

  public saveAttendanceBulk(
    records: {
      student_id: string;
      tanggal: string;
      status: Attendance['status'];
      jam_masuk?: string;
      keterangan?: string;
    }[]
  ) {
    const now = new Date().toISOString();
    const author = this.currentUser?.nama || 'Guru Piket';

    records.forEach((rec) => {
      const existingIdx = this.attendances.findIndex(
        (a) => a.student_id === rec.student_id && a.tanggal === rec.tanggal
      );

      if (existingIdx >= 0) {
        this.attendances[existingIdx] = {
          ...this.attendances[existingIdx],
          status: rec.status,
          jam_masuk: rec.jam_masuk || '',
          keterangan: rec.keterangan || '',
          updated_at: now,
        };
      } else {
        this.attendances.push({
          id: `att-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          student_id: rec.student_id,
          tanggal: rec.tanggal,
          status: rec.status,
          jam_masuk: rec.jam_masuk || '',
          keterangan: rec.keterangan || '',
          created_by: author,
          created_at: now,
          updated_at: now,
        });
      }
    });

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(this.attendances));
    this.notify();
  }

  // --- Monthly Recaps & Computations ---
  public getMonthlyRecaps(bulan: number, tahun: number, kelas?: string, jurusan?: string) {
    // Combine dynamic data for student + month + year
    const students = this.getStudents();
    const recaps: (MonthlyRecap & { student: Student })[] = [];

    students.forEach((std) => {
      if (kelas && std.kelas !== kelas) return;
      if (jurusan && std.jurusan !== jurusan) return;

      // Filter violations in this month & year
      const stdViolations = this.violations.filter((v) => {
        if (v.student_id !== std.id) return false;
        const d = new Date(v.tanggal);
        return d.getMonth() + 1 === bulan && d.getFullYear() === tahun;
      });

      const totalPoin = stdViolations.reduce((sum, v) => sum + (v.poin || 0), 0);
      const violationCount = stdViolations.length;

      // Filter attendances in this month & year
      const stdAttendances = this.attendances.filter((a) => {
        if (a.student_id !== std.id) return false;
        const d = new Date(a.tanggal);
        return d.getMonth() + 1 === bulan && d.getFullYear() === tahun;
      });

      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpha = 0;
      let terlambat = 0;

      stdAttendances.forEach((a) => {
        if (a.status === 'Hadir') hadir++;
        else if (a.status === 'Sakit') sakit++;
        else if (a.status === 'Izin') izin++;
        else if (a.status === 'Alpha') alpha++;
        else if (a.status === 'Terlambat') terlambat++;
      });

      // Check if there is a manual override or saved recap in storage
      const saved = this.monthlyRecaps.find(
        (r) => r.student_id === std.id && r.bulan === bulan && r.tahun === tahun
      );

      const statusInfo = this.getDisciplineStatus(saved ? saved.total_poin : totalPoin);

      recaps.push({
        id: saved?.id || `mrc-${std.id}-${bulan}-${tahun}`,
        student_id: std.id,
        bulan,
        tahun,
        jumlah_pelanggaran: saved ? saved.jumlah_pelanggaran : violationCount,
        total_poin: saved ? saved.total_poin : totalPoin,
        hadir: saved ? saved.hadir : hadir,
        sakit: saved ? saved.sakit : sakit,
        izin: saved ? saved.izin : izin,
        alpha: saved ? saved.alpha : alpha,
        terlambat: saved ? saved.terlambat : terlambat,
        status_pembinaan: statusInfo.status,
        created_at: saved?.created_at || new Date().toISOString(),
        updated_at: saved?.updated_at || new Date().toISOString(),
        student: std,
      });
    });

    return recaps;
  }

  public saveMonthlyRecapsBulk(recapsToSave: Omit<MonthlyRecap, 'id' | 'created_at' | 'updated_at'>[]) {
    const now = new Date().toISOString();
    recapsToSave.forEach((item) => {
      const idx = this.monthlyRecaps.findIndex(
        (m) => m.student_id === item.student_id && m.bulan === item.bulan && m.tahun === item.tahun
      );

      if (idx >= 0) {
        this.monthlyRecaps[idx] = {
          ...this.monthlyRecaps[idx],
          ...item,
          updated_at: now,
        };
      } else {
        this.monthlyRecaps.push({
          ...item,
          id: `mrc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          created_at: now,
          updated_at: now,
        });
      }
    });

    localStorage.setItem(STORAGE_KEYS.MONTHLY_RECAPS, JSON.stringify(this.monthlyRecaps));
    this.notify();
  }

  // --- Statistics for Dashboard ---
  public getDashboardStats(selectedYear?: number, selectedMonth?: number, selectedClass?: string) {
    const currentYear = selectedYear || 2026;
    const currentMonth = selectedMonth || 3; // March

    // All active students
    let filteredStudents = this.students.filter((s) => s.status === 'Aktif');
    if (selectedClass) {
      filteredStudents = filteredStudents.filter((s) => s.kelas === selectedClass);
    }
    const totalSiswa = filteredStudents.length;

    // Violations this month
    const studentIds = new Set(filteredStudents.map((s) => s.id));
    const violationsThisMonth = this.violations.filter((v) => {
      if (!studentIds.has(v.student_id)) return false;
      const d = new Date(v.tanggal);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });

    const totalPelanggaranBulanIni = violationsThisMonth.length;
    const uniqueViolatingStudents = new Set(violationsThisMonth.map((v) => v.student_id)).size;
    const totalPoinBulanIni = violationsThisMonth.reduce((acc, v) => acc + (v.poin || 0), 0);

    // Today's attendance
    const todayStr = '2026-03-06';
    const todayAttendances = this.attendances.filter(
      (a) => a.tanggal === todayStr && studentIds.has(a.student_id)
    );

    const jumlahHadirHariIni = todayAttendances.filter((a) => a.status === 'Hadir').length;
    const jumlahTerlambatHariIni = todayAttendances.filter((a) => a.status === 'Terlambat').length;
    const jumlahTidakHadirHariIni = todayAttendances.filter(
      (a) => a.status === 'Sakit' || a.status === 'Izin' || a.status === 'Alpha'
    ).length;

    // Monthly violation chart data (12 months of selectedYear)
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    const violationsPerMonth = monthNames.map((name, idx) => {
      const monthNum = idx + 1;
      const monthViolations = this.violations.filter((v) => {
        if (!studentIds.has(v.student_id)) return false;
        const d = new Date(v.tanggal);
        return d.getFullYear() === currentYear && d.getMonth() + 1 === monthNum;
      });

      return {
        bulan: name,
        bulanNum: monthNum,
        jumlah: monthViolations.length,
        poin: monthViolations.reduce((sum, v) => sum + (v.poin || 0), 0),
      };
    });

    // Category chart data
    const categoryCounts: Record<string, number> = {};
    violationsThisMonth.forEach((v) => {
      const vt = this.violationTypes.find((t) => t.id === v.violation_type_id);
      const cat = vt?.kategori || 'Lainnya';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const violationsByCategory = Object.entries(categoryCounts).map(([kategori, count]) => ({
      kategori,
      count,
    })).sort((a, b) => b.count - a.count);

    // If empty for this month, show across all time or general distribution for visualization
    if (violationsByCategory.length === 0) {
      const allCatCounts: Record<string, number> = {};
      this.violations.forEach((v) => {
        const vt = this.violationTypes.find((t) => t.id === v.violation_type_id);
        const cat = vt?.kategori || 'Lainnya';
        allCatCounts[cat] = (allCatCounts[cat] || 0) + 1;
      });
      Object.entries(allCatCounts).forEach(([kategori, count]) => {
        violationsByCategory.push({ kategori, count });
      });
      violationsByCategory.sort((a, b) => b.count - a.count);
    }

    // Attendance distribution for the selected month
    const monthAttendances = this.attendances.filter((a) => {
      if (!studentIds.has(a.student_id)) return false;
      const d = new Date(a.tanggal);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });

    let hadirCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let alphaCount = 0;
    let terlambatCount = 0;

    monthAttendances.forEach((a) => {
      if (a.status === 'Hadir') hadirCount++;
      else if (a.status === 'Sakit') sakitCount++;
      else if (a.status === 'Izin') izinCount++;
      else if (a.status === 'Alpha') alphaCount++;
      else if (a.status === 'Terlambat') terlambatCount++;
    });

    const attendanceSummary = [
      { name: 'Hadir', value: hadirCount, color: '#10b981' },
      { name: 'Sakit', value: sakitCount, color: '#38bdf8' },
      { name: 'Izin', value: izinCount, color: '#f59e0b' },
      { name: 'Alpha', value: alphaCount, color: '#ef4444' },
      { name: 'Terlambat', value: terlambatCount, color: '#f97316' },
    ];

    // Top 10 Students with highest violation points (overall or for filter)
    const studentPointMap: {
      student: Student;
      totalPoints: number;
      violationCount: number;
    }[] = [];

    filteredStudents.forEach((student) => {
      const studentViolations = this.violations.filter((v) => {
        if (v.student_id !== student.id) return false;
        if (!selectedMonth && !selectedYear) return true;
        const d = new Date(v.tanggal);
        const matchYear = selectedYear ? d.getFullYear() === selectedYear : true;
        const matchMonth = selectedMonth ? d.getMonth() + 1 === selectedMonth : true;
        return matchYear && matchMonth;
      });

      const totalPoints = studentViolations.reduce((sum, v) => sum + (v.poin || 0), 0);
      if (totalPoints > 0) {
        studentPointMap.push({
          student,
          totalPoints,
          violationCount: studentViolations.length,
        });
      }
    });

    studentPointMap.sort((a, b) => b.totalPoints - a.totalPoints);
    const top10Students = studentPointMap.slice(0, 10).map((item, index) => ({
      rank: index + 1,
      student: item.student,
      nis: item.student.nis,
      nama: item.student.nama,
      kelas: item.student.kelas,
      foto: item.student.foto,
      violationCount: item.violationCount,
      totalPoints: item.totalPoints,
      statusInfo: this.getDisciplineStatus(item.totalPoints),
    }));

    return {
      totalSiswa,
      totalPelanggaranBulanIni,
      uniqueViolatingStudents,
      totalPoinBulanIni,
      jumlahHadirHariIni,
      jumlahTidakHadirHariIni,
      jumlahTerlambatHariIni,
      violationsPerMonth,
      violationsByCategory,
      attendanceSummary,
      top10Students,
    };
  }

  // --- Excel Export & Import Functions ---

  public exportStudentsToExcel(studentsList: Student[]) {
    const rows = studentsList.map((s) => {
      const violations = this.violations.filter((v) => v.student_id === s.id);
      const totalPoints = violations.reduce((acc, v) => acc + (v.poin || 0), 0);
      const statusInfo = this.getDisciplineStatus(totalPoints);

      return {
        NIS: s.nis,
        NISN: s.nisn,
        Nama: s.nama,
        'Jenis Kelamin': s.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan',
        Kelas: s.kelas,
        Jurusan: s.jurusan,
        Angkatan: s.angkatan,
        'No HP': s.no_hp,
        'Nama Orang Tua': s.nama_orang_tua,
        'No HP Orang Tua': s.no_hp_orang_tua,
        Status: s.status,
        'Total Poin': totalPoints,
        'Status Pembinaan': statusInfo.status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto fit column widths
    const colWidths = [
      { wch: 12 }, // NIS
      { wch: 14 }, // NISN
      { wch: 28 }, // Nama
      { wch: 15 }, // Gender
      { wch: 12 }, // Kelas
      { wch: 24 }, // Jurusan
      { wch: 10 }, // Angkatan
      { wch: 16 }, // No HP
      { wch: 24 }, // Nama Ortu
      { wch: 16 }, // No HP Ortu
      { wch: 10 }, // Status
      { wch: 12 }, // Total Poin
      { wch: 20 }, // Status Pembinaan
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Data_Siswa_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  public downloadStudentTemplate() {
    const templateRows = [
      {
        NIS: '24251099',
        NISN: '0071234599',
        'Nama Lengkap': 'Nama Siswa Contoh',
        'Jenis Kelamin': 'L',
        Kelas: 'X RPL 1',
        Jurusan: 'Rekayasa Perangkat Lunak',
        Angkatan: '2024',
        'No HP': '081234567890',
        'Nama Orang Tua': 'Nama Orang Tua Contoh',
        'No HP Orang Tua': '081298765432',
      },
      {
        NIS: '24251100',
        NISN: '0071234600',
        'Nama Lengkap': 'Siti Aisyah',
        'Jenis Kelamin': 'P',
        Kelas: 'X TKJ 1',
        Jurusan: 'Teknik Komputer & Jaringan',
        Angkatan: '2024',
        'No HP': '081234567891',
        'Nama Orang Tua': 'Ahmad Fauzi',
        'No HP Orang Tua': '081298765433',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 14 },
      { wch: 26 },
      { wch: 14 },
      { wch: 12 },
      { wch: 24 },
      { wch: 10 },
      { wch: 16 },
      { wch: 24 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Siswa');
    XLSX.writeFile(workbook, 'Template_Import_Siswa.xlsx');
  }

  public exportMonthlyRecapToExcel(
    recapsList: (MonthlyRecap & { student: Student })[],
    bulan: number,
    tahun: number
  ) {
    const rows = recapsList.map((item) => ({
      NIS: item.student.nis,
      Nama: item.student.nama,
      Kelas: item.student.kelas,
      'Jumlah Pelanggaran': item.jumlah_pelanggaran,
      'Total Poin': item.total_poin,
      Hadir: item.hadir,
      Sakit: item.sakit,
      Izin: item.izin,
      Alpha: item.alpha,
      Terlambat: item.terlambat,
      'Status Pembinaan': item.status_pembinaan,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_${bulan}_${tahun}`);

    const fileName = `Rekap_Kedisiplinan_${bulan}_${tahun}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  public exportViolationsToExcel(violationsList: any[]) {
    const rows = violationsList.map((v, idx) => ({
      No: idx + 1,
      Tanggal: v.tanggal,
      Jam: v.jam || '-',
      NIS: v.student?.nis || '-',
      'Nama Siswa': v.student?.nama || '-',
      Kelas: v.student?.kelas || '-',
      'Jenis Pelanggaran': v.violationType?.nama || '-',
      Kategori: v.violationType?.kategori || '-',
      Tingkat: v.violationType?.tingkat || '-',
      Poin: v.poin,
      Lokasi: v.lokasi || '-',
      Petugas: v.petugas_nama || '-',
      Kronologi: v.kronologi || '-',
      'Tindak Lanjut': v.tindak_lanjut || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat_Pelanggaran');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Riwayat_Pelanggaran_${dateStr}.xlsx`);
  }

  public downloadMonthlyRecapTemplate(bulan: number, tahun: number) {
    const templateRows = [
      {
        NIS: '24251001',
        'Jumlah Pelanggaran': 1,
        'Total Poin': 5,
        Hadir: 20,
        Sakit: 1,
        Izin: 0,
        Alpha: 0,
        Terlambat: 1,
      },
      {
        NIS: '24251003',
        'Jumlah Pelanggaran': 3,
        'Total Poin': 75,
        Hadir: 16,
        Sakit: 1,
        Izin: 0,
        Alpha: 3,
        Terlambat: 2,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Rekap');
    XLSX.writeFile(workbook, `Template_Rekap_${bulan}_${tahun}.xlsx`);
  }
}

export const db = new DatabaseService();
