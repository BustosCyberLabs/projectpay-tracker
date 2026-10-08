import { Project, ProjectCalculations, AttentionItem } from '../types';
import {
  getLocalDateString,
  formatLocalDate,
  formatLocalDateTime,
  getDayDifference,
} from './dates';

/**
 * Deterministic financial calculations for a single project.
 * Never allows negative numbers.
 * Never divides by zero.
 */
export function calculateProject(project: Project, taxReservePercent: number): ProjectCalculations {
  const safeRateOrPrice = Math.max(0, Number(project.rateOrPrice) || 0);
  const safePaidHours = Math.max(0, Number(project.paidHours) || 0);
  const safeUnpaidHours = Math.max(0, Number(project.unpaidHours) || 0);
  const safeTaxPercent = Math.max(0, Number(taxReservePercent) || 0);

  // Earned
  let earned = 0;
  if (project.payType === 'hourly') {
    earned = safeRateOrPrice * safePaidHours;
  } else {
    earned = safeRateOrPrice;
  }
  earned = round2(earned);

  // Paid
  const paid = round2(
    (project.payments || []).reduce((sum, p) => sum + Math.max(0, Number(p.amount) || 0), 0)
  );

  // Owed = Earned - Money Paid (cannot be negative)
  const owed = round2(Math.max(0, earned - paid));

  // Save for Taxes = Paid * Tax Reserve Percentage
  const estimatedTaxSavings = round2(paid * (safeTaxPercent / 100));

  // Available After Reserve = Paid - Save for Taxes
  const availableAfterReserve = round2(paid - estimatedTaxSavings);

  // Total Hours Spent = Paid Work Hours + Unpaid/Admin Hours
  const totalHoursSpent = round2(safePaidHours + safeUnpaidHours);

  // Real Hourly Rate = Earned / Total Hours Spent (null if zero)
  let realHourlyRate: number | null = null;
  if (totalHoursSpent > 0) {
    realHourlyRate = round2(earned / totalHoursSpent);
  }

  return {
    earned,
    paid,
    owed,
    estimatedTaxSavings,
    availableAfterReserve,
    totalHoursSpent,
    realHourlyRate,
  };
}

/**
 * Calculates global money totals across all projects.
 */
export function calculateTotals(projects: Project[], taxReservePercent: number) {
  let earned = 0;
  let paid = 0;
  let owed = 0;
  let estimatedTaxSavings = 0;
  let totalHours = 0;

  for (const project of projects) {
    const calc = calculateProject(project, taxReservePercent);
    earned += calc.earned;
    paid += calc.paid;
    owed += calc.owed;
    estimatedTaxSavings += calc.estimatedTaxSavings;
    totalHours += calc.totalHoursSpent;
  }

  return {
    earned: round2(earned),
    paid: round2(paid),
    owed: round2(owed),
    saveForTaxes: round2(estimatedTaxSavings),
    totalHours: round2(totalHours),
  };
}

/**
 * Formats a number to USD currency ($1,234.56).
 */
export function formatCurrency(amount: number): string {
  const safe = Math.max(0, Number(amount) || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * Formats hours cleanly (e.g. 12 hrs or 12.5 hrs).
 */
export function formatHours(hours: number): string {
  const safe = Math.max(0, Number(hours) || 0);
  const formatted = Number.isInteger(safe) ? safe.toString() : safe.toFixed(1);
  return `${formatted} ${safe === 1 ? 'hr' : 'hrs'}`;
}

/**
 * Formats YYYY-MM-DD date to friendly string using local calendar date (e.g. Oct 6, 2026).
 */
export function formatDate(dateStr: string): string {
  return formatLocalDate(dateStr);
}

/**
 * Formats ISO or YYYY-MM-DDTHH:mm to friendly local string.
 */
export function formatDateTime(dateTimeStr: string): string {
  return formatLocalDateTime(dateTimeStr);
}

/**
 * Identifies "Needs Attention" items across projects.
 */
export function getNeedsAttentionItems(projects: Project[], taxReservePercent: number): AttentionItem[] {
  const items: AttentionItem[] = [];
  const now = new Date();
  const todayStr = getLocalDateString(now);

  for (const project of projects) {
    const calc = calculateProject(project, taxReservePercent);

    // 1. Payment Overdue (Due date has passed and payment is still owed)
    if (project.dueDate && project.dueDate < todayStr && calc.owed > 0) {
      items.push({
        id: `overdue-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        client: project.client,
        type: 'payment_overdue',
        title: 'Payment overdue',
        detail: `${formatCurrency(calc.owed)} still owed (Due ${formatDate(project.dueDate)})`,
        dueDate: project.dueDate,
        amountOwed: calc.owed,
      });
      continue; // Don't duplicate with payment still owed
    }

    // 2. Project Due Soon (Within next 3 days and not done)
    if (project.dueDate && project.status !== 'done' && project.dueDate >= todayStr) {
      const diffDays = getDayDifference(project.dueDate, todayStr);
      if (diffDays >= 0 && diffDays <= 3) {
        items.push({
          id: `due-soon-${project.id}`,
          projectId: project.id,
          projectName: project.name,
          client: project.client,
          type: 'due_soon',
          title: 'Project due soon',
          detail: diffDays === 0 ? 'Due today' : `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'} (${formatDate(project.dueDate)})`,
          dueDate: project.dueDate,
        });
      }
    }

    // 3. Project Reminder (reminder date set and upcoming or passed, and not done)
    if (project.reminderDateTime && project.status !== 'done') {
      const reminderDate = new Date(project.reminderDateTime);
      if (!isNaN(reminderDate.getTime())) {
        const diffHours = (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours <= 48) {
          const isPast = diffHours <= 0;
          items.push({
            id: `reminder-${project.id}`,
            projectId: project.id,
            projectName: project.name,
            client: project.client,
            type: 'reminder',
            title: 'Project reminder',
            detail: isPast ? `Reminder passed (${formatDateTime(project.reminderDateTime)})` : `Reminder scheduled for ${formatDateTime(project.reminderDateTime)}`,
            reminderDateTime: project.reminderDateTime,
          });
        }
      }
    }

    // 4. Payment Still Owed (Project is Done but client has not paid in full)
    if (project.status === 'done' && calc.owed > 0) {
      items.push({
        id: `owed-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        client: project.client,
        type: 'payment_owed',
        title: 'Payment still owed',
        detail: `${formatCurrency(calc.owed)} remaining to be collected`,
        amountOwed: calc.owed,
      });
    }

    // 5. Next Action (If set on active or offer project)
    if (project.nextAction && project.nextAction.trim() !== '' && project.status !== 'done') {
      items.push({
        id: `action-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        client: project.client,
        type: 'next_action',
        title: 'Next action',
        detail: project.nextAction.trim(),
      });
    }
  }

  return items;
}

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
