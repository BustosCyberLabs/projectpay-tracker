/**
 * Reusable local-calendar date utilities for ProjectPay Tracker.
 * 
 * CRITICAL: These helpers ensure dates always represent the user's local
 * calendar day (e.g. October 6 in California remains October 6, even late at night,
 * and is NEVER converted through UTC which would shift it to October 7).
 */

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Returns the user's current local date formatted as YYYY-MM-DD.
 * Does NOT use toISOString() which shifts time to UTC.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date string to 'Oct 6, 2026'.
 * Operates purely on the string components with zero timezone conversion.
 */
export function formatLocalDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12) {
    return dateStr;
  }

  return `${SHORT_MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

/**
 * Formats a YYYY-MM-DD date string to 'October 6, 2026'.
 * Operates purely on the string components with zero timezone conversion.
 */
export function formatLongLocalDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12) {
    return dateStr;
  }

  return `${FULL_MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

/**
 * Returns today's report generated date in the user's local timezone:
 * e.g. "October 6, 2026"
 */
export function getReportGeneratedDate(d: Date = new Date()): string {
  return formatLongLocalDate(getLocalDateString(d));
}

/**
 * Calculates whole calendar-day difference between a due date (YYYY-MM-DD)
 * and today's local date (YYYY-MM-DD).
 * Positive = future, 0 = today, Negative = past.
 */
export function getDayDifference(targetDateStr: string, baseDateStr: string = getLocalDateString()): number {
  if (!targetDateStr || !baseDateStr) return 0;
  const [y1, m1, d1] = targetDateStr.split('-').map(Number);
  const [y2, m2, d2] = baseDateStr.split('-').map(Number);

  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) {
    return 0;
  }

  // Use midday local time to eliminate any daylight saving transition anomalies
  const t1 = new Date(y1, m1 - 1, d1, 12, 0, 0).getTime();
  const t2 = new Date(y2, m2 - 1, d2, 12, 0, 0).getTime();

  return Math.round((t1 - t2) / (1000 * 60 * 60 * 24));
}

/**
 * Formats YYYY-MM-DDTHH:mm to readable local string:
 * e.g. "Oct 6, 2026 at 2:00 PM"
 */
export function formatLocalDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
