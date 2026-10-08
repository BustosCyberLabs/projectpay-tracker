import React from 'react';
import { Project, AppSettings, Payment } from '../types';
import { calculateProject, formatCurrency, formatHours, formatDate } from '../utils/calculations';
import { getReportGeneratedDate } from '../utils/dates';
import { exportProjectPaySheetCsv } from '../utils/export';
import { X, Download, Trash2, FileText, Printer } from 'lucide-react';

interface PaySheetModalProps {
  project: Project;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onDeletePayment?: (projectId: string, paymentId: string) => void;
}

export const PaySheetModal: React.FC<PaySheetModalProps> = ({
  project,
  settings,
  isOpen,
  onClose,
  onDeletePayment,
}) => {
  if (!isOpen) return null;

  const calc = calculateProject(project, settings.taxReservePercent);

  const handleExport = () => {
    exportProjectPaySheetCsv(project, settings);
  };

  const handlePrint = () => {
    window.print();
  };

  const reportGeneratedDate = getReportGeneratedDate();

  return (
    <>
      {/* On-Screen Modal View */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:hidden">
        <div className="w-full max-w-2xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Project Pay Sheet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {project.name} {project.client ? `· ${project.client}` : ''}
                </p>
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

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Main 4 Money Totals for this Project */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Earned
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {formatCurrency(calc.earned)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Paid
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {formatCurrency(calc.paid)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Owed
                </div>
                <div className={`text-lg font-semibold tabular-nums mt-0.5 ${calc.owed > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {formatCurrency(calc.owed)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Save for Taxes
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {formatCurrency(calc.estimatedTaxSavings)}
                </div>
              </div>
            </div>

            {/* Details & Rates Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-lg space-y-2.5">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-2">
                  Rate & Hours Breakdown
                </h4>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Pay Type</span>
                  <span className="font-medium text-slate-900 dark:text-white capitalize">{project.payType}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{project.payType === 'hourly' ? 'Hourly Rate' : 'Fixed Price'}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(project.rateOrPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Paid Work Hours</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatHours(project.paidHours)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Unpaid / Admin Hours</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatHours(project.unpaidHours)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white">
                  <span>Total Hours Spent</span>
                  <span>{formatHours(calc.totalHoursSpent)}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-lg space-y-2.5">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-2">
                  Taxes & Real Rate
                </h4>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Tax Reserve Percentage</span>
                  <span className="font-medium text-slate-900 dark:text-white">{settings.taxReservePercent}%</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Available After Reserve</span>
                  <span className="font-medium text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(calc.availableAfterReserve)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white">
                  <span>Real Hourly Rate</span>
                  <span className="tabular-nums">
                    {calc.realHourlyRate !== null
                      ? `${formatCurrency(calc.realHourlyRate)}/hr`
                      : 'Not available yet'}
                  </span>
                </div>
                {project.dueDate && (
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <span>Due Date</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatDate(project.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes or Next Action if present */}
            {(project.nextAction || project.notes) && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs space-y-1.5">
                {project.nextAction && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Next Action: </span>
                    <span className="text-slate-600 dark:text-slate-400">{project.nextAction}</span>
                  </div>
                )}
                {project.notes && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Notes: </span>
                    <span className="text-slate-600 dark:text-slate-400">{project.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Itemized Payments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Payments Received ({project.payments?.length || 0})
                </h4>
              </div>

              {(!project.payments || project.payments.length === 0) ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No payments recorded yet for this project.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Amount</th>
                        <th className="px-3 py-2 font-medium">Note</th>
                        {onDeletePayment && <th className="px-3 py-2 text-right font-medium">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {project.payments.map((pmt: Payment) => (
                        <tr key={pmt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {formatDate(pmt.date)}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(pmt.amount)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {pmt.note || '—'}
                          </td>
                          {onDeletePayment && (
                            <td className="px-3 py-2.5 text-right">
                              <button
                                onClick={() => onDeletePayment(project.id, pmt.id)}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                title="Delete this payment record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Pay Sheet (CSV)
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors self-end sm:self-auto"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Clean Print View (Hidden on Screen, Active on Print / Save as PDF) */}
      <div id="printable-pay-sheet" className="hidden print:block font-sans text-black bg-white">
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid #000000', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#000000' }}>
              Project Pay Sheet
            </h1>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0', color: '#000000' }}>
              {project.name}
            </h2>
            {project.client && (
              <p style={{ fontSize: '14px', margin: 0, color: '#000000' }}>
                Client / Platform: <strong>{project.client}</strong>
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#000000' }}>
            <p style={{ fontWeight: 'bold', margin: 0 }}>ProjectPay Tracker</p>
            <p style={{ margin: '4px 0 0 0' }}>Report generated: {reportGeneratedDate}</p>
            <p style={{ margin: '2px 0 0 0' }}>Project status: <strong style={{ textTransform: 'capitalize' }}>{project.status}</strong></p>
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000000', paddingBottom: '4px', marginBottom: '12px' }}>
            Money Summary
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'left', fontSize: '12px' }}>Earned</th>
                <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'left', fontSize: '12px' }}>Paid</th>
                <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'left', fontSize: '12px' }}>Owed</th>
                <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'left', fontSize: '12px' }}>Save for Taxes ({settings.taxReservePercent}%)</th>
                <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'left', fontSize: '12px' }}>Available After Tax Reserve</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}>{formatCurrency(calc.earned)}</td>
                <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}>{formatCurrency(calc.paid)}</td>
                <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}>{formatCurrency(calc.owed)}</td>
                <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}>{formatCurrency(calc.estimatedTaxSavings)}</td>
                <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}>{formatCurrency(calc.availableAfterReserve)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Hours & Rates Breakdown */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000000', paddingBottom: '4px', marginBottom: '12px' }}>
            Hours & Rates Breakdown
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '35%', backgroundColor: '#f9fafb', fontWeight: '600' }}>Pay Type & Rate</td>
                <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>
                  {project.payType === 'hourly'
                    ? `Hourly · ${formatCurrency(project.rateOrPrice)}/hr`
                    : `Fixed Project Price · ${formatCurrency(project.rateOrPrice)}`}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000000', padding: '6px 10px', backgroundColor: '#f9fafb', fontWeight: '600' }}>Paid Work Hours</td>
                <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{formatHours(project.paidHours)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000000', padding: '6px 10px', backgroundColor: '#f9fafb', fontWeight: '600' }}>Unpaid / Admin Hours</td>
                <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{formatHours(project.unpaidHours)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000000', padding: '6px 10px', backgroundColor: '#f9fafb', fontWeight: '600' }}>Total Hours Spent</td>
                <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: 'bold' }}>{formatHours(calc.totalHoursSpent)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000000', padding: '6px 10px', backgroundColor: '#f9fafb', fontWeight: '600' }}>Real Hourly Rate</td>
                <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: 'bold' }}>
                  {calc.realHourlyRate !== null
                    ? `${formatCurrency(calc.realHourlyRate)}/hr`
                    : 'Not available yet'}
                </td>
              </tr>
              {project.dueDate && (
                <tr>
                  <td style={{ border: '1px solid #000000', padding: '6px 10px', backgroundColor: '#f9fafb', fontWeight: '600' }}>Due Date</td>
                  <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{formatDate(project.dueDate)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment History */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000000', paddingBottom: '4px', marginBottom: '12px' }}>
            Payment History ({project.payments?.length || 0})
          </h3>
          {(!project.payments || project.payments.length === 0) ? (
            <p style={{ fontSize: '13px', fontStyle: 'italic', margin: '4px 0' }}>No payments recorded yet for this project.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ border: '1px solid #000000', padding: '6px 10px', textAlign: 'left', width: '25%' }}>Payment Date</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 10px', textAlign: 'left', width: '25%' }}>Amount</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 10px', textAlign: 'left' }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {project.payments.map((pmt) => (
                  <tr key={pmt.id}>
                    <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{formatDate(pmt.date)}</td>
                    <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: 'bold' }}>{formatCurrency(pmt.amount)}</td>
                    <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{pmt.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Notes */}
        {project.notes && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000000', paddingBottom: '4px', marginBottom: '8px' }}>
              Notes
            </h3>
            <div style={{ border: '1px solid #000000', padding: '10px', fontSize: '13px', whiteSpace: 'pre-line' }}>
              {project.notes}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
