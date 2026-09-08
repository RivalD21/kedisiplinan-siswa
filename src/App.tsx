import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/ToastContainer';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { StudentDetail } from './pages/StudentDetail';
import { InputViolation } from './pages/InputViolation';
import { ViolationsHistory } from './pages/ViolationsHistory';
import { Attendance } from './pages/Attendance';
import { MonthlyRecap } from './pages/MonthlyRecap';
import { MasterViolations } from './pages/MasterViolations';
import { Settings } from './pages/Settings';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab, toasts, removeToast, sidebarOpen } = useApp();

  // If user is not authenticated, display login screen
  if (!currentUser) {
    return (
      <>
        <Login />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Topbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'students' && <Students />}
          {activeTab === 'student-detail' && <StudentDetail />}
          {activeTab === 'input-violation' && <InputViolation />}
          {activeTab === 'violations-history' && <ViolationsHistory />}
          {activeTab === 'attendance' && <Attendance />}
          {activeTab === 'monthly-recap' && <MonthlyRecap />}
          {activeTab === 'master-violations' && <MasterViolations />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
