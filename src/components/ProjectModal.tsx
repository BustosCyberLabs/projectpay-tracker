import React, { useState } from 'react';
import { Project, PayType, ProjectStatus } from '../types';
import { getLocalDateString } from '../utils/dates';
import { X, Trash2 } from 'lucide-react';

interface ProjectModalProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(project);

  const [name, setName] = useState<string>(project?.name || '');
  const [client, setClient] = useState<string>(project?.client || '');
  const [payType, setPayType] = useState<PayType>(project?.payType || 'hourly');
  const [rateOrPrice, setRateOrPrice] = useState<string>(
    project ? project.rateOrPrice.toString() : ''
  );
  const [paidHours, setPaidHours] = useState<string>(
    project ? project.paidHours.toString() : '0'
  );
  const [unpaidHours, setUnpaidHours] = useState<string>(
    project ? project.unpaidHours.toString() : '0'
  );
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'active');
  const [nextAction, setNextAction] = useState<string>(project?.nextAction || '');
  const [reminderDateTime, setReminderDateTime] = useState<string>(
    project?.reminderDateTime || ''
  );
  const [dueDate, setDueDate] = useState<string>(project?.dueDate || '');
  const [notes, setNotes] = useState<string>(project?.notes || '');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }

    const safeRateOrPrice = Math.max(0, parseFloat(rateOrPrice) || 0);
    const safePaidHours = Math.max(0, parseFloat(paidHours) || 0);
    const safeUnpaidHours = Math.max(0, parseFloat(unpaidHours) || 0);

    const savedProject: Project = {
      id: project ? project.id : `proj-${Date.now()}`,
      name: name.trim(),
      client: client.trim(),
      payType,
      rateOrPrice: Math.round(safeRateOrPrice * 100) / 100,
      paidHours: Math.round(safePaidHours * 100) / 100,
      unpaidHours: Math.round(safeUnpaidHours * 100) / 100,
      payments: project ? project.payments : [],
      status,
      nextAction: nextAction.trim(),
      reminderDateTime,
      dueDate,
      notes: notes.trim(),
      createdAt: project ? project.createdAt : getLocalDateString(),
    };

    onSave(savedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Project' : 'New Project'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-2.5 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brand Identity Overhaul"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client or Platform
                </label>
                <input
                  type="text"
                  placeholder="e.g. Upwork, Acme Corp, Local Cafe"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Pay Type & Rate/Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pay Type
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setPayType('hourly')}
                    className={`flex-1 py-1.5 rounded-md transition-colors ${
                      payType === 'hourly'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Hourly
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayType('fixed')}
                    className={`flex-1 py-1.5 rounded-md transition-colors ${
                      payType === 'fixed'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Fixed Price
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {payType === 'hourly' ? 'Hourly Rate ($/hr)' : 'Fixed Project Price ($)'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={rateOrPrice}
                    onChange={(e) => setRateOrPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Paid Work Hours
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={paidHours}
                  onChange={(e) => setPaidHours(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unpaid / Admin Hours
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={unpaidHours}
                  onChange={(e) => setUnpaidHours(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStatus('offer')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    status === 'offer'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Offer / Lead
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    status === 'active'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('done')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    status === 'done'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Next Action */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Next Action
              </label>
              <input
                type="text"
                placeholder="e.g. Email revised proposal, Send invoice #2"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Dates: Reminder & Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reminder Date and Time
                </label>
                <input
                  type="datetime-local"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Scope details, contacts, payment terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(project!.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Project
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
