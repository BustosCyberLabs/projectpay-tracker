import React, { useState } from 'react';
import { Project } from '../types';
import { X, Clock, Plus } from 'lucide-react';

interface LogHoursModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectId: string, updatedPaidHours: number, updatedUnpaidHours: number) => void;
}

export const LogHoursModal: React.FC<LogHoursModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
}) => {
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [addPaid, setAddPaid] = useState<string>('');
  const [addUnpaid, setAddUnpaid] = useState<string>('');
  const [totalPaid, setTotalPaid] = useState<string>(project.paidHours.toString());
  const [totalUnpaid, setTotalUnpaid] = useState<string>(project.unpaidHours.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalPaid = project.paidHours;
    let finalUnpaid = project.unpaidHours;

    if (mode === 'add') {
      const addedPaidNum = Math.max(0, parseFloat(addPaid) || 0);
      const addedUnpaidNum = Math.max(0, parseFloat(addUnpaid) || 0);
      finalPaid = project.paidHours + addedPaidNum;
      finalUnpaid = project.unpaidHours + addedUnpaidNum;
    } else {
      finalPaid = Math.max(0, parseFloat(totalPaid) || 0);
      finalUnpaid = Math.max(0, parseFloat(totalUnpaid) || 0);
    }

    onSave(project.id, Math.round(finalPaid * 100) / 100, Math.round(finalUnpaid * 100) / 100);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Log Hours</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {/* Current Totals Banner */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div>
                <span className="font-medium text-slate-500 dark:text-slate-400">Current Paid: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{project.paidHours} hrs</span>
              </div>
              <div className="text-slate-300 dark:text-slate-700">·</div>
              <div>
                <span className="font-medium text-slate-500 dark:text-slate-400">Current Admin/Unpaid: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{project.unpaidHours} hrs</span>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode('add')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  mode === 'add'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                + Add Hours to Existing
              </button>
              <button
                type="button"
                onClick={() => setMode('set')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  mode === 'set'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Set Exact Total
              </button>
            </div>

            {mode === 'add' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Add Paid Work Hours
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="e.g. 2.5"
                    value={addPaid}
                    onChange={(e) => setAddPaid(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-slate-400">Billable hours worked on client deliverables</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Add Unpaid / Admin Hours
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="e.g. 0.5"
                    value={addUnpaid}
                    onChange={(e) => setAddUnpaid(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">Emails, setup, revisions, or meeting time</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Paid Work Hours
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={totalPaid}
                    onChange={(e) => setTotalPaid(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Unpaid / Admin Hours
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={totalUnpaid}
                    onChange={(e) => setTotalUnpaid(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
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
              Save Hours
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
