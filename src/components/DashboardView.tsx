import React from 'react';
import { Project, AppSettings, AttentionItem } from '../types';
import { calculateTotals, calculateProject, formatCurrency, formatHours, getNeedsAttentionItems } from '../utils/calculations';
import {
  Clock,
  Calendar,
  Plus,
  CheckCircle2,
  FileText,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  settings: AppSettings;
  onNewProject: () => void;
  onLogHours: (project: Project) => void;
  onAddPayment: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onViewPaySheet: (project: Project) => void;
  onNavigateToProjects: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  settings,
  onNewProject,
  onLogHours,
  onAddPayment,
  onEditProject,
  onViewPaySheet,
  onNavigateToProjects,
}) => {
  const totals = calculateTotals(projects, settings.taxReservePercent);
  const attentionItems = getNeedsAttentionItems(projects, settings.taxReservePercent);

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-2">
      {/* 1. Four Main Money Totals - Calm notebook style */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Earned */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Earned
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tabular-nums mt-1.5">
              {formatCurrency(totals.earned)}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Total work logged
            </div>
          </div>

          {/* Paid */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Paid
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tabular-nums mt-1.5">
              {formatCurrency(totals.paid)}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Collected so far
            </div>
          </div>

          {/* Owed */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Owed
            </div>
            <div className={`text-2xl sm:text-3xl font-semibold tabular-nums mt-1.5 ${totals.owed > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(totals.owed)}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Left to collect
            </div>
          </div>

          {/* Save for Taxes */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Save for Taxes
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tabular-nums mt-1.5">
              {formatCurrency(totals.saveForTaxes)}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Set aside ({settings.taxReservePercent}%)
            </div>
          </div>
        </div>
      </section>

      {/* 2. Needs Attention Section - Prominent and easy to scan */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Needs Attention
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reminders, deadlines, and pending payments
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            {attentionItems.length} {attentionItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {attentionItems.length === 0 ? (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">All caught up. </span>
              No pending reminders, upcoming due dates, or overdue payments right now.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attentionItems.map((item: AttentionItem) => {
              const project = projects.find((p) => p.id === item.projectId);
              if (!project) return null;

              const isOverdue = item.type === 'payment_overdue';
              const isDueSoon = item.type === 'due_soon';

              return (
                <div
                  key={item.id}
                  className={`p-4 bg-white dark:bg-slate-900 border rounded-xl flex flex-col justify-between transition-colors ${
                    isOverdue
                      ? 'border-rose-300 dark:border-rose-900/60'
                      : isDueSoon
                      ? 'border-amber-300 dark:border-amber-900/60'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span
                        className={`font-semibold ${
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400'
                            : isDueSoon
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.client && (
                        <span className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[140px]">
                          {item.client}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {item.projectName}
                    </div>

                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {item.detail}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onViewPaySheet(project)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      View Details
                    </button>

                    <div className="flex items-center gap-2">
                      {item.type === 'payment_overdue' || item.type === 'payment_owed' ? (
                        <button
                          onClick={() => onAddPayment(project)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          Add Payment
                        </button>
                      ) : (
                        <button
                          onClick={() => onLogHours(project)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          Log Hours
                        </button>
                      )}
                      <button
                        onClick={() => onEditProject(project)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. My Projects Section - Clean, scan-friendly organizer */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              My Projects
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active freelance projects and recent work
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToProjects}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            >
              See all ({projects.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No projects added yet. Add your first freelance project to begin tracking.
            </p>
            <button
              onClick={onNewProject}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 6).map((project) => {
              const calc = calculateProject(project, settings.taxReservePercent);
              return (
                <div
                  key={project.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Info */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {project.name}
                      </span>
                      {project.client && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          · {project.client}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        · {project.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>{project.payType === 'hourly' ? `${formatCurrency(project.rateOrPrice)}/hr` : 'Fixed price'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatHours(project.paidHours)} worked</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Owed: <strong className={`font-semibold tabular-nums ${calc.owed > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>{formatCurrency(calc.owed)}</strong>
                      </span>
                      {calc.realHourlyRate !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Real rate: <strong className="text-slate-700 dark:text-slate-300 font-semibold tabular-nums">{formatCurrency(calc.realHourlyRate)}/hr</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: 3 Main Actions with unified, consistent button styling */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => onLogHours(project)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Log Hours
                    </button>
                    <button
                      onClick={() => onAddPayment(project)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Add Payment
                    </button>
                    <button
                      onClick={() => onEditProject(project)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onViewPaySheet(project)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                      title="View Project Pay Sheet"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
