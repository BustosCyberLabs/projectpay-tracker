import React, { useState } from 'react';
import { Project, Payment } from '../types';
import { calculateProject, formatCurrency } from '../utils/calculations';
import { getLocalDateString } from '../utils/dates';
import { X, DollarSign } from 'lucide-react';

interface AddPaymentModalProps {
  project: Project;
  taxReservePercent: number;
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (projectId: string, payment: Payment) => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  project,
  taxReservePercent,
  isOpen,
  onClose,
  onAddPayment,
}) => {
  const calc = calculateProject(project, taxReservePercent);
  const today = getLocalDateString();

  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(today);
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a payment amount greater than zero.');
      return;
    }

    if (!date) {
      setError('Please select a payment date.');
      return;
    }

    const newPayment: Payment = {
      id: `pmt-${Date.now()}`,
      amount: Math.round(parsedAmount * 100) / 100,
      date,
      note: note.trim(),
    };

    onAddPayment(project.id, newPayment);
    onClose();
  };

  const handlePayFullBalance = () => {
    if (calc.owed > 0) {
      setAmount(calc.owed.toString());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add Payment</h3>
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
            {/* Balance Overview */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Earned: </span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(calc.earned)}
                </span>
              </div>
              <div className="text-slate-300 dark:text-slate-700">·</div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Already Paid: </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(calc.paid)}
                </span>
              </div>
              <div className="text-slate-300 dark:text-slate-700">·</div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Still Owed: </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatCurrency(calc.owed)}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-2.5 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Amount ($)
                </label>
                {calc.owed > 0 && (
                  <button
                    type="button"
                    onClick={handlePayFullBalance}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    Pay Full Balance ({formatCurrency(calc.owed)})
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Deposit, Stripe payout, Check #104"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
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
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
