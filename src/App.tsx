import React, { useState, useEffect } from 'react';
import { Project, AppSettings, Payment, ThemeMode } from './types';
import {
  getStoredProjects,
  saveStoredProjects,
  getStoredSettings,
  saveStoredSettings,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { RecordsView } from './components/RecordsView';
import { SettingsView } from './components/SettingsView';
import { ProjectModal } from './components/ProjectModal';
import { LogHoursModal } from './components/LogHoursModal';
import { AddPaymentModal } from './components/AddPaymentModal';
import { PaySheetModal } from './components/PaySheetModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LayoutDashboard, FolderGit2, FileSpreadsheet, Settings, Plus, X } from 'lucide-react';

export default function App() {
  // Local state
  const [projects, setProjects] = useState<Project[]>(() => getStoredProjects());
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'records' | 'settings'>('dashboard');

  // Modal states
  const [editingProject, setEditingProject] = useState<Project | null | 'new'>(null);
  const [hoursProject, setHoursProject] = useState<Project | null>(null);
  const [paymentProject, setPaymentProject] = useState<Project | null>(null);
  const [paySheetProject, setPaySheetProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // Sync projects to storage
  useEffect(() => {
    saveStoredProjects(projects);
  }, [projects]);

  // Sync settings to storage
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Apply Theme to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };

    if (settings.theme === 'dark') {
      applyTheme(true);
    } else if (settings.theme === 'light') {
      applyTheme(false);
    } else {
      // System Default
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  // Handlers for Projects
  const handleSaveProject = (savedProject: Project) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === savedProject.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProject.id ? savedProject : p));
      }
      return [savedProject, ...prev];
    });
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setDeletingProjectId(null);
    setEditingProject(null);
    if (paySheetProject?.id === projectId) setPaySheetProject(null);
  };

  const handleSaveHours = (projectId: string, paidHours: number, unpaidHours: number) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              paidHours: Math.max(0, paidHours),
              unpaidHours: Math.max(0, unpaidHours),
            }
          : p
      )
    );
  };

  const handleAddPayment = (projectId: string, payment: Payment) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              payments: [...(p.payments || []), payment],
            }
          : p
      )
    );
  };

  const handleDeletePayment = (projectId: string, paymentId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          payments: (p.payments || []).filter((pmt) => pmt.id !== paymentId),
        };
      })
    );

    // Also update paySheetProject if open
    if (paySheetProject && paySheetProject.id === projectId) {
      setPaySheetProject({
        ...paySheetProject,
        payments: (paySheetProject.payments || []).filter((pmt) => pmt.id !== paymentId),
      });
    }
  };

  const handleRestoreBackup = (restoredProjects: Project[], restoredSettings: AppSettings) => {
    setProjects(restoredProjects);
    setSettings(restoredSettings);
  };

  const handleResetAllData = () => {
    setProjects([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const dismissWelcome = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      setSettings((prev) => ({ ...prev, hideWelcome: true }));
    } else {
      // Just dismiss for this session by updating state or hiding
      setSettings((prev) => ({ ...prev, hideWelcome: true }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500/20 selection:text-emerald-700">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group cursor-pointer"
            >
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                ProjectPay Tracker
              </span>
            </button>
          </div>

          {/* Navigation Links: Exactly 4 areas */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'projects'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'records'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Records
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Quick Action */}
          <div className="hidden sm:flex items-center">
            <button
              onClick={() => setEditingProject('new')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* First-Time Use Welcome Message */}
        {!settings.hideWelcome && (
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                ProjectPay Tracker helps you keep track of your freelance projects, hours, payments, reminders, and estimated tax savings.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A simple personal notebook for your freelance work.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => dismissWelcome(true)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Don't show this again
              </button>
              <button
                onClick={() => dismissWelcome(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        {/* Render Active Area */}
        {activeTab === 'dashboard' && (
          <DashboardView
            projects={projects}
            settings={settings}
            onNewProject={() => setEditingProject('new')}
            onLogHours={(p) => setHoursProject(p)}
            onAddPayment={(p) => setPaymentProject(p)}
            onEditProject={(p) => setEditingProject(p)}
            onViewPaySheet={(p) => setPaySheetProject(p)}
            onNavigateToProjects={() => setActiveTab('projects')}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            settings={settings}
            onNewProject={() => setEditingProject('new')}
            onLogHours={(p) => setHoursProject(p)}
            onAddPayment={(p) => setPaymentProject(p)}
            onEditProject={(p) => setEditingProject(p)}
            onViewPaySheet={(p) => setPaySheetProject(p)}
          />
        )}

        {activeTab === 'records' && (
          <RecordsView
            projects={projects}
            settings={settings}
            onRestoreBackup={handleRestoreBackup}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>ProjectPay Tracker · Fast & simple personal freelance work tracker</p>
      </footer>

      {/* Modal: Add or Edit Project */}
      {editingProject && (
        <ProjectModal
          project={editingProject === 'new' ? null : editingProject}
          isOpen={true}
          onClose={() => setEditingProject(null)}
          onSave={handleSaveProject}
          onDelete={(id) => setDeletingProjectId(id)}
        />
      )}

      {/* Modal: Log Hours */}
      {hoursProject && (
        <LogHoursModal
          project={hoursProject}
          isOpen={true}
          onClose={() => setHoursProject(null)}
          onSave={handleSaveHours}
        />
      )}

      {/* Modal: Add Payment */}
      {paymentProject && (
        <AddPaymentModal
          project={paymentProject}
          taxReservePercent={settings.taxReservePercent}
          isOpen={true}
          onClose={() => setPaymentProject(null)}
          onAddPayment={handleAddPayment}
        />
      )}

      {/* Modal: Project Pay Sheet */}
      {paySheetProject && (
        <PaySheetModal
          project={paySheetProject}
          settings={settings}
          isOpen={true}
          onClose={() => setPaySheetProject(null)}
          onDeletePayment={handleDeletePayment}
        />
      )}

      {/* Modal: Confirm Project Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingProjectId)}
        title="Delete Project?"
        message="Are you sure you want to delete this project? This will remove its recorded hours and payments from this device."
        confirmLabel="Yes, Delete Project"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => deletingProjectId && handleDeleteProject(deletingProjectId)}
        onCancel={() => setDeletingProjectId(null)}
      />
    </div>
  );
}
