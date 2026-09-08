import React from 'react';
import { DisciplineLevel, AttendanceStatus, ViolationSeverity, StudentStatus } from '../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'info' | 'warning' | 'orange' | 'danger' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  let colorClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (variant === 'success') {
    colorClasses = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80';
  } else if (variant === 'info') {
    colorClasses = 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800/80';
  } else if (variant === 'warning') {
    colorClasses = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/80';
  } else if (variant === 'orange') {
    colorClasses = 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800/80';
  } else if (variant === 'danger') {
    colorClasses = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/80';
  } else if (variant === 'purple') {
    colorClasses = 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/80';
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap ${sizeClasses} ${colorClasses}`}
    >
      {children}
    </span>
  );
};

export const DisciplineBadge: React.FC<{ level: DisciplineLevel }> = ({ level }) => {
  switch (level) {
    case 'Aman':
      return <Badge variant="success">{level}</Badge>;
    case 'Perhatian':
      return <Badge variant="info">{level}</Badge>;
    case 'Pembinaan':
      return <Badge variant="warning">{level}</Badge>;
    case 'Panggilan Orang Tua':
      return <Badge variant="orange">{level}</Badge>;
    case 'Penanganan Khusus':
      return <Badge variant="danger">{level}</Badge>;
    default:
      return <Badge variant="neutral">{level}</Badge>;
  }
};

export const AttendanceBadge: React.FC<{ status: AttendanceStatus }> = ({ status }) => {
  switch (status) {
    case 'Hadir':
      return <Badge variant="success">Hadir</Badge>;
    case 'Sakit':
      return <Badge variant="info">Sakit</Badge>;
    case 'Izin':
      return <Badge variant="warning">Izin</Badge>;
    case 'Alpha':
      return <Badge variant="danger">Alpha</Badge>;
    case 'Terlambat':
      return <Badge variant="orange">Terlambat</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const SeverityBadge: React.FC<{ severity: ViolationSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'Ringan':
      return <Badge variant="info">Ringan</Badge>;
    case 'Sedang':
      return <Badge variant="warning">Sedang</Badge>;
    case 'Berat':
      return <Badge variant="danger">Berat</Badge>;
    default:
      return <Badge>{severity}</Badge>;
  }
};

export const StudentStatusBadge: React.FC<{ status: StudentStatus }> = ({ status }) => {
  switch (status) {
    case 'Aktif':
      return <Badge variant="success">Aktif</Badge>;
    case 'Alumni':
      return <Badge variant="neutral">Alumni</Badge>;
    case 'Pindah':
      return <Badge variant="warning">Pindah</Badge>;
    case 'Dikeluarkan':
      return <Badge variant="danger">Dikeluarkan</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
