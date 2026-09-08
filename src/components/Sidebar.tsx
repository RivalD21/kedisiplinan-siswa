import React from 'react';
import { useApp, NavTab } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  AlertOctagon,
  History,
  CalendarCheck,
  FileSpreadsheet,
  BookOpenCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldAlert,
} from 'lucide-react';

interface MenuItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Data Siswa', icon: Users },
  { id: 'input-violation', label: 'Input Pelanggaran', icon: AlertOctagon },
  { id: 'violations-history', label: 'Riwayat Pelanggaran', icon: History },
  { id: 'attendance', label: 'Absensi', icon: CalendarCheck },
  { id: 'monthly-recap', label: 'Rekap Bulanan', icon: FileSpreadsheet },
  { id: 'master-violations', label: 'Master Pelanggaran', icon: BookOpenCheck },
  { id: 'settings', label: 'Pengaturan', icon: Settings, adminOnly: true },
];

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    sidebarOpen,
    toggleSidebar,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    currentUser,
    setCurrentUser,
    showToast,
  } = useApp();

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Berhasil keluar dari akun', 'info');
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          {(sidebarOpen || isMobileDrawerOpen) && (
            <div className="truncate animate-fadeIn">
              <span className="font-extrabold text-sm text-white tracking-wide block">
                SKS KEDISIPLINAN
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Portal Disiplin Siswa
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {isMobileDrawerOpen && (
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation items */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isRestricted = item.adminOnly && currentUser?.role !== 'admin';

          return (
            <button
              key={item.id}
              id={`sidebar-menu-${item.id}`}
              onClick={() => {
                if (isRestricted) {
                  showToast('Menu Pengaturan hanya dapat diakses oleh Administrator', 'warning');
                  return;
                }
                setActiveTab(item.id);
              }}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : isRestricted
                  ? 'text-slate-500 hover:text-slate-400 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {(sidebarOpen || isMobileDrawerOpen) && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {isRestricted && (sidebarOpen || isMobileDrawerOpen) && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer: User summary & collapse toggle */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* Logout Button */}
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(sidebarOpen || isMobileDrawerOpen) && <span>Logout</span>}
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          id="sidebar-collapse-btn"
          onClick={toggleSidebar}
          className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={sidebarOpen ? 'Perkecil Sidebar' : 'Perbesar Sidebar'}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ChevronLeft className="w-4 h-4" />
              <span>Sembunyikan</span>
            </div>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="desktop-sidebar"
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="fixed top-0 bottom-0 left-0 z-40 h-full border-r border-slate-800 transition-all duration-300 ease-in-out">
          <div className={sidebarOpen ? 'w-64 h-full' : 'w-20 h-full'}>{navContent}</div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10">{navContent}</div>
        </div>
      )}
    </>
  );
};
