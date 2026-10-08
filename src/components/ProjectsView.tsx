import React, { useState } from 'react';
import { Project, AppSettings, ProjectStatus } from '../types';
import { calculateProject, formatCurrency, formatHours, formatDate, formatDateTime } from '../utils/calculations';
import { Plus, Search, FileText } from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  settings: AppSettings;
  onNewProject: () => void;
  onLogHours: (project: Project) => void;
  onAddPayment: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onViewPaySheet: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  settings,
  onNewProject,
  onLogHours,
  onAddPayment,
  onEditProject,
  onViewPaySheet,
}) => {
  const [filter, setFilter] = useState<'all' | ProjectStatus>('all');
  const [search, setSearch] = useState<string>('');

  const filteredProjects = projects.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.nextAction.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header bar: Title, Search, Filter Tabs, + New Project */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep track of your client projects, hours, and payments
          </p>
        </div>

        <button
          onClick={onNewProject}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active ({projects.filter((p) => p.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('offer')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'offer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Offer ({projects.filter((p) => p.status === 'offer').length})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'done'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Done ({projects.filter((p) => p.status === 'done').length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute inset-y-0 left-0 pl-3 w-4 h-4 text-slate-400 pointer-events-none my-auto" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {search ? 'No projects match your search.' : 'No projects found in this view.'}
          </p>
          <button
            onClick={onNewProject}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const calc = calculateProject(project, settings.taxReservePercent);

            return (
              <div
                key={project.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Header: Name, Client, Status & 3 Actions */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {project.name}
                      </h2>
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
                      <span>
                        {project.payType === 'hourly'
                          ? `Hourly rate: ${formatCurrency(project.rateOrPrice)}/hr`
                          : `Fixed price: ${formatCurrency(project.rateOrPrice)}`}
                      </span>
                      {project.dueDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Due: {formatDate(project.dueDate)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 3 Main Actions with consistent button styling */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
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

                {/* Clean financial & hours numbers - generous whitespace, no nested cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Earned</div>
                    <div className="font-semibold text-slate-900 dark:text-white tabular-nums text-sm mt-0.5">
                      {formatCurrency(calc.earned)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Paid</div>
                    <div className="font-semibold text-slate-900 dark:text-white tabular-nums text-sm mt-0.5">
                      {formatCurrency(calc.paid)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Owed</div>
                    <div className={`font-semibold tabular-nums text-sm mt-0.5 ${calc.owed > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                      {formatCurrency(calc.owed)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Paid Work Hours</div>
                    <div className="font-semibold text-slate-900 dark:text-white tabular-nums text-sm mt-0.5">
                      {formatHours(project.paidHours)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Unpaid/Admin Hours</div>
                    <div className="font-semibold text-slate-900 dark:text-white tabular-nums text-sm mt-0.5">
                      {formatHours(project.unpaidHours)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Real Hourly Rate</div>
                    <div className="font-semibold text-slate-900 dark:text-white tabular-nums text-sm mt-0.5">
                      {calc.realHourlyRate !== null
                        ? `${formatCurrency(calc.realHourlyRate)}/hr`
                        : 'Not available yet'}
                    </div>
                  </div>
                </div>

                {/* Plain language context: Next Action, Reminder, Notes */}
                {(project.nextAction || project.reminderDateTime || project.notes) && (
                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                    {project.nextAction && (
                      <div className="flex items-start gap-1.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200 shrink-0">
                          Next Action:
                        </span>
                        <span>{project.nextAction}</span>
                      </div>
                    )}
                    {project.reminderDateTime && (
                      <div className="flex items-start gap-1.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200 shrink-0">
                          Reminder:
                        </span>
                        <span>{formatDateTime(project.reminderDateTime)}</span>
                      </div>
                    )}
                    {project.notes && (
                      <div className="flex items-start gap-1.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200 shrink-0">
                          Notes:
                        </span>
                        <span className="line-clamp-2">{project.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
