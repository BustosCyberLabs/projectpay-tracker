import React, { useState, useRef } from 'react';
import { Project, AppSettings } from '../types';
import { formatCurrency, formatHours, formatDate } from '../utils/calculations';
import {
  exportPaymentHistoryCsv,
  exportTaxYearSummaryCsv,
  exportProjectPaySheetCsv,
  downloadJsonBackup,
} from '../utils/export';
import { exportFullBackup, validateBackup } from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';
import { Download, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RecordsViewProps {
  projects: Project[];
  settings: AppSettings;
  onRestoreBackup: (projects: Project[], settings: AppSettings) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  projects,
  settings,
  onRestoreBackup,
}) => {
  const currentYear = new Date().getFullYear();

  // Extract all unique years from payments and project creation dates
  const availableYearsSet = new Set<number>([currentYear]);
  for (const p of projects) {
    if (p.createdAt) {
      const yr = parseInt(p.createdAt.split('-')[0], 10);
      if (!isNaN(yr)) availableYearsSet.add(yr);
    }
    for (const pmt of p.payments || []) {
      if (pmt.date) {
        const yr = parseInt(pmt.date.split('-')[0], 10);
        if (!isNaN(yr)) availableYearsSet.add(yr);
      }
    }
  }
  const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedProjectForSheet, setSelectedProjectForSheet] = useState<string>(
    projects.length > 0 ? projects[0].id : ''
  );

  // Restore state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{
    projects: Project[];
    settings: AppSettings;
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string>('');
  const [restoreSuccess, setRestoreSuccess] = useState<string>('');

  // Calculate tax-year summary
  const yearStr = selectedYear.toString();
  let totalPaid = 0;
  let paymentCount = 0;
  let totalHours = 0;
  let projectsCompleted = 0;

  const yearPayments: Array<{
    id: string;
    projectId: string;
    projectName: string;
    client: string;
    date: string;
    amount: number;
    note?: string;
  }> = [];

  for (const project of projects) {
    let hasYearActivity = false;

    for (const pmt of project.payments || []) {
      if (pmt.date && pmt.date.startsWith(yearStr)) {
        totalPaid += pmt.amount;
        paymentCount += 1;
        hasYearActivity = true;
        yearPayments.push({
          id: pmt.id,
          projectId: project.id,
          projectName: project.name,
          client: project.client,
          date: pmt.date,
          amount: pmt.amount,
          note: pmt.note,
        });
      }
    }

    if (hasYearActivity) {
      totalHours += project.paidHours + project.unpaidHours;
    }

    if (project.status === 'done' && (hasYearActivity || project.createdAt?.startsWith(yearStr))) {
      projectsCompleted += 1;
    }
  }

  // Sort payments descending by date
  yearPayments.sort((a, b) => b.date.localeCompare(a.date));

  const estimatedTaxSavings = totalPaid * (settings.taxReservePercent / 100);

  const handleDownloadBackup = () => {
    const backupJson = exportFullBackup();
    downloadJsonBackup(backupJson);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError('');
    setRestoreSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateBackup(content);
      if (!result.success || !result.projects || !result.settings) {
        setRestoreError(result.error || 'Failed to parse backup file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setPendingRestore({
        projects: result.projects,
        settings: result.settings,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
      setRestoreError('Failed to read the selected file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const confirmRestore = () => {
    if (pendingRestore) {
      onRestoreBackup(pendingRestore.projects, pendingRestore.settings);
      setRestoreSuccess(`Restored successfully. Loaded ${pendingRestore.projects.length} projects.`);
      setPendingRestore(null);
    }
  };

  const handleExportSelectedPaySheet = () => {
    const proj = projects.find((p) => p.id === selectedProjectForSheet);
    if (proj) {
      exportProjectPaySheetCsv(proj, settings);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Records</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Payment history, tax-year summaries, and personal backup files
          </p>
        </div>

        {/* Tax-Year Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Tax Year:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr} Tax Year
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tax-Year Summary Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {selectedYear} Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tax reserve rate: {settings.taxReservePercent}%
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportTaxYearSummaryCsv(projects, selectedYear, settings)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Tax-Year Summary (CSV)
            </button>
            <button
              onClick={() => exportPaymentHistoryCsv(projects)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              All Payments (CSV)
            </button>
          </div>
        </div>

        {/* 5 Summary Stat Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Total Paid
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
              {formatCurrency(totalPaid)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Save for Taxes
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
              {formatCurrency(estimatedTaxSavings)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Number of Payments
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
              {paymentCount}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Total Hours
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
              {formatHours(totalHours)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Projects Completed
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
              {projectsCompleted}
            </div>
          </div>
        </div>
      </section>

      {/* Itemized Payments for the selected Year */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Payments Received in {selectedYear} ({yearPayments.length})
          </h3>
        </div>

        {yearPayments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No payments recorded in {selectedYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Project Name</th>
                  <th className="px-4 py-2.5 font-medium">Client</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {yearPayments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {formatDate(pmt.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {pmt.projectName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {pmt.client || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(pmt.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {pmt.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Individual Project Pay Sheet Export */}
      <section className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Individual Project Pay Sheet Export
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export an itemized pay sheet with hours, tax savings, and payment receipts for any project.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <select
            value={selectedProjectForSheet}
            onChange={(e) => setSelectedProjectForSheet(e.target.value)}
            disabled={projects.length === 0}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.client ? `(${p.client})` : ''} · {p.status}
                </option>
              ))
            )}
          </select>

          <button
            onClick={handleExportSelectedPaySheet}
            disabled={!selectedProjectForSheet}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Project Pay Sheet (CSV)
          </button>
        </div>
      </section>

      {/* Full Application Backup & Restore */}
      <section className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Full Application Backup & Restore
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export a complete JSON backup to keep safe or transfer to another device.
          </p>
        </div>

        {restoreError && (
          <div className="p-3 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{restoreError}</span>
          </div>
        )}

        {restoreSuccess && (
          <div className="p-3 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{restoreSuccess}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Full Backup (JSON)
          </button>

          <input
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Restore from Backup (JSON)
          </button>
        </div>
      </section>

      {/* Confirmation Modal before Overwriting Backup */}
      <ConfirmModal
        isOpen={Boolean(pendingRestore)}
        title="Restore Application Backup?"
        message={`Warning: Restoring this backup will replace your current data with ${pendingRestore?.projects.length || 0} projects from the backup file.\n\nAre you sure you want to proceed?`}
        confirmLabel="Yes, Overwrite & Restore"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={confirmRestore}
        onCancel={() => setPendingRestore(null)}
      />
    </div>
  );
};
