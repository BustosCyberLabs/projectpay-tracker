import { Project, AppSettings } from '../types';
import { calculateProject } from './calculations';
import { getLocalDateString, formatLocalDate } from './dates';

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function triggerDownload(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Payment History CSV export
 */
export function exportPaymentHistoryCsv(projects: Project[]): void {
  const headers = ['Project Name', 'Client', 'Payment Date', 'Amount ($)', 'Pay Type', 'Project Status', 'Note'];
  const rows: string[] = [headers.join(',')];

  for (const project of projects) {
    for (const pmt of project.payments || []) {
      rows.push([
        escapeCsv(project.name),
        escapeCsv(project.client),
        escapeCsv(pmt.date),
        pmt.amount.toFixed(2),
        escapeCsv(project.payType),
        escapeCsv(project.status),
        escapeCsv(pmt.note || ''),
      ].join(','));
    }
  }

  const csvContent = rows.join('\r\n');
  const filename = `payment-history-${getLocalDateString()}.csv`;
  triggerDownload(csvContent, filename);
}

/**
 * 2. Tax-Year Summary CSV export
 */
export function exportTaxYearSummaryCsv(projects: Project[], taxYear: number, settings: AppSettings): void {
  const yearStr = taxYear.toString();
  const taxRate = settings.taxReservePercent;

  let totalPaid = 0;
  let paymentCount = 0;
  let totalHours = 0;
  let projectsCompleted = 0;

  const itemizedPayments: Array<{
    projectName: string;
    client: string;
    date: string;
    amount: number;
    note: string;
  }> = [];

  for (const project of projects) {
    let hasYearActivity = false;

    for (const pmt of project.payments || []) {
      if (pmt.date && pmt.date.startsWith(yearStr)) {
        totalPaid += pmt.amount;
        paymentCount += 1;
        hasYearActivity = true;
        itemizedPayments.push({
          projectName: project.name,
          client: project.client,
          date: pmt.date,
          amount: pmt.amount,
          note: pmt.note || '',
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

  const estimatedTaxSavings = (totalPaid * (taxRate / 100));

  const rows: string[] = [
    `"TAX-YEAR SUMMARY: ${taxYear}"`,
    `"Generated On",${escapeCsv(formatLocalDate(getLocalDateString()))}`,
    `"Tax Reserve Percentage",${taxRate}%`,
    '',
    `"METRIC","VALUE"`,
    `"Total Paid","$${totalPaid.toFixed(2)}"`,
    `"Save for Taxes","$${estimatedTaxSavings.toFixed(2)}"`,
    `"Available After Reserve","$${(totalPaid - estimatedTaxSavings).toFixed(2)}"`,
    `"Number of Payments",${paymentCount}`,
    `"Total Hours",${totalHours.toFixed(1)}`,
    `"Projects Completed",${projectsCompleted}`,
    '',
    `"ITEMIZED PAYMENTS FOR ${taxYear}"`,
    `"Project Name","Client","Payment Date","Amount ($)","Note"`,
  ];

  for (const p of itemizedPayments) {
    rows.push([
      escapeCsv(p.projectName),
      escapeCsv(p.client),
      escapeCsv(p.date),
      p.amount.toFixed(2),
      escapeCsv(p.note),
    ].join(','));
  }

  const csvContent = rows.join('\r\n');
  const filename = `tax-summary-${taxYear}.csv`;
  triggerDownload(csvContent, filename);
}

/**
 * 3. Individual Project Pay Sheet export
 */
export function exportProjectPaySheetCsv(project: Project, settings: AppSettings): void {
  const calc = calculateProject(project, settings.taxReservePercent);
  const rows: string[] = [
    `"PROJECT PAY SHEET"`,
    `"Project Name",${escapeCsv(project.name)}`,
    `"Client or Platform",${escapeCsv(project.client)}`,
    `"Status",${escapeCsv(project.status.toUpperCase())}`,
    `"Pay Type",${escapeCsv(project.payType.toUpperCase())}`,
    `"Hourly Rate / Fixed Price","$${project.rateOrPrice.toFixed(2)}"`,
    `"Paid Work Hours",${project.paidHours.toFixed(1)}`,
    `"Unpaid / Admin Hours",${project.unpaidHours.toFixed(1)}`,
    `"Total Hours Spent",${calc.totalHoursSpent.toFixed(1)}`,
    `"Earned","$${calc.earned.toFixed(2)}"`,
    `"Paid","$${calc.paid.toFixed(2)}"`,
    `"Owed","$${calc.owed.toFixed(2)}"`,
    `"Save for Taxes (${settings.taxReservePercent}%)","$${calc.estimatedTaxSavings.toFixed(2)}"`,
    `"Available After Reserve","$${calc.availableAfterReserve.toFixed(2)}"`,
    `"Real Hourly Rate",${calc.realHourlyRate !== null ? `"$${calc.realHourlyRate.toFixed(2)}/hr"` : '"Not available yet"'}`,
    `"Due Date",${escapeCsv(project.dueDate || 'None')}`,
    `"Next Action",${escapeCsv(project.nextAction || 'None')}`,
    `"Reminder Date and Time",${escapeCsv(project.reminderDateTime || 'None')}`,
    `"Notes",${escapeCsv(project.notes || '')}`,
    '',
    `"PAYMENTS RECEIVED"`,
    `"Payment Date","Amount ($)","Note"`,
  ];

  for (const pmt of project.payments || []) {
    rows.push([
      escapeCsv(pmt.date),
      pmt.amount.toFixed(2),
      escapeCsv(pmt.note || ''),
    ].join(','));
  }

  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
  const filename = `pay-sheet-${safeName}-${getLocalDateString()}.csv`;
  triggerDownload(rows.join('\r\n'), filename);
}

/**
 * 4. Full application JSON backup download
 */
export function downloadJsonBackup(jsonString: string): void {
  const filename = `projectpay-backup-${getLocalDateString()}.json`;
  triggerDownload(jsonString, filename, 'application/json;charset=utf-8;');
}
