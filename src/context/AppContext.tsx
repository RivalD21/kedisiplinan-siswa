import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ToastMessage } from '../types';
import { db } from '../services/db';

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'input-violation'
  | 'violations-history'
  | 'attendance'
  | 'monthly-recap'
  | 'master-violations'
  | 'settings'
  | 'student-detail';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedStudentId: string | null;
  openStudentDetail: (id: string) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme initialization
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sks_theme_preference_v1');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());

  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sks_theme_preference_v1', theme);
  }, [theme]);

  // Subscribe to DB changes
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setCurrentUser(db.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const openStudentDetail = (id: string) => {
    setSelectedStudentId(id);
    setActiveTab('student-detail');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        setCurrentUser: (user) => {
          db.setCurrentUser(user);
          setCurrentUser(user);
        },
        activeTab,
        setActiveTab: (tab) => {
          setActiveTab(tab);
          setIsMobileDrawerOpen(false);
        },
        selectedStudentId,
        openStudentDetail,
        toasts,
        showToast,
        removeToast,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
