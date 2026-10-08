import { Project, AppSettings, Payment } from '../types';
import { getLocalDateString } from './dates';

const PROJECTS_KEY = 'projectpay_tracker_projects_v1';
const SETTINGS_KEY = 'projectpay_tracker_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  taxReservePercent: 30,
  theme: 'system',
  hideWelcome: false,
};

export const INITIAL_SAMPLE_PROJECTS: Project[] = [
  {
    id: 'sample-project-1',
    name: 'Website Redesign & Launch',
    client: 'Acme Studio',
    payType: 'hourly',
    rateOrPrice: 65,
    paidHours: 14,
    unpaidHours: 2,
    payments: [
      {
        id: 'sample-pay-1',
        amount: 500,
        date: '2026-10-01',
        note: 'Initial deposit',
      },
    ],
    status: 'active',
    nextAction: 'Send final responsive preview to client',
    reminderDateTime: '2026-10-10T14:00',
    dueDate: '2026-10-16',
    notes: 'Hourly contract. 14 hours logged so far. Client pays net 15.',
    createdAt: '2026-10-01',
  },
];

export function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) {
      // First run: save sample project
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(INITIAL_SAMPLE_PROJECTS));
      return INITIAL_SAMPLE_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_SAMPLE_PROJECTS;
  } catch {
    return INITIAL_SAMPLE_PROJECTS;
  }
}

export function saveStoredProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage:', err);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      taxReservePercent: typeof parsed.taxReservePercent === 'number' && parsed.taxReservePercent >= 0
        ? parsed.taxReservePercent
        : DEFAULT_SETTINGS.taxReservePercent,
      theme: ['system', 'light', 'dark'].includes(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
      hideWelcome: Boolean(parsed.hideWelcome),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function exportFullBackup(): string {
  const data = {
    version: 1,
    appName: 'ProjectPay Tracker',
    exportedAt: getLocalDateString(),
    settings: getStoredSettings(),
    projects: getStoredProjects(),
  };
  return JSON.stringify(data, null, 2);
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  projects?: Project[];
  settings?: AppSettings;
}

export function validateBackup(jsonString: string): RestoreResult {
  try {
    const parsed: unknown = JSON.parse(jsonString);

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value);

    const validNumber = (value: unknown): value is number =>
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0;

    const validDate = (value: unknown): value is string => {
      if (typeof value !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));

      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      );
    };

    const validDateTime = (value: unknown): value is string => {
      if (typeof value !== 'string') return false;
      if (value === '') return true;

      const match =
        /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);

      if (!match) return false;

      return (
        validDate(match[1]) &&
        Number(match[2]) <= 23 &&
        Number(match[3]) <= 59
      );
    };

    if (!isRecord(parsed)) {
      return {
        success: false,
        error: 'Invalid backup file: expected a JSON object.',
      };
    }

    if (parsed.version !== 1 ||
        parsed.appName !== 'ProjectPay Tracker') {
      return {
        success: false,
        error: 'Invalid or unsupported ProjectPay Tracker backup.',
      };
    }

    if (!Array.isArray(parsed.projects)) {
      return {
        success: false,
        error: 'Invalid backup file: missing projects list.',
      };
    }

    const projects: Project[] = [];
    const projectIds = new Set<string>();

    for (let i = 0; i < parsed.projects.length; i++) {
      const p: unknown = parsed.projects[i];

      if (!isRecord(p)) {
        return {
          success: false,
          error: `Invalid project at index ${i}.`,
        };
      }

      if (
        typeof p.id !== 'string' ||
        !p.id.trim() ||
        projectIds.has(p.id) ||
        typeof p.name !== 'string' ||
        !p.name.trim() ||
        typeof p.client !== 'string' ||
        !['hourly', 'fixed'].includes(String(p.payType)) ||
        !validNumber(p.rateOrPrice) ||
        !validNumber(p.paidHours) ||
        !validNumber(p.unpaidHours) ||
        !['offer', 'active', 'done'].includes(String(p.status)) ||
        typeof p.nextAction !== 'string' ||
        !validDateTime(p.reminderDateTime) ||
        !(p.dueDate === '' || validDate(p.dueDate)) ||
        typeof p.notes !== 'string' ||
        !(validDate(p.createdAt) || (typeof p.createdAt === 'string' && !Number.isNaN(Date.parse(p.createdAt)) && /^\d{4}-\d{2}-\d{2}T/.test(p.createdAt))) ||
        !Array.isArray(p.payments)
      ) {
        return {
          success: false,
          error: `Invalid project data at index ${i}.`,
        };
      }

      projectIds.add(p.id);

      const payments: Payment[] = [];
      const paymentIds = new Set<string>();

      for (let j = 0; j < p.payments.length; j++) {
        const payment: unknown = p.payments[j];

        if (
          !isRecord(payment) ||
          typeof payment.id !== 'string' ||
          !payment.id.trim() ||
          paymentIds.has(payment.id) ||
          !validNumber(payment.amount) ||
          !validDate(payment.date) ||
          (payment.note !== undefined &&
            typeof payment.note !== 'string')
        ) {
          return {
            success: false,
            error: `Invalid payment ${j} in project ${i}.`,
          };
        }

        paymentIds.add(payment.id);

        payments.push({
          id: payment.id,
          amount: payment.amount,
          date: payment.date,
          note: typeof payment.note === 'string'
            ? payment.note
            : '',
        });
      }

      projects.push({
        id: p.id,
        name: p.name,
        client: p.client,
        payType: p.payType as Project['payType'],
        rateOrPrice: p.rateOrPrice,
        paidHours: p.paidHours,
        unpaidHours: p.unpaidHours,
        payments,
        status: p.status as Project['status'],
        nextAction: p.nextAction,
        reminderDateTime: p.reminderDateTime,
        dueDate: p.dueDate,
        notes: p.notes,
        createdAt: p.createdAt,
      });
    }

    if (!isRecord(parsed.settings)) {
      return {
        success: false,
        error: 'Invalid backup settings.',
      };
    }

    const savedSettings = parsed.settings;

    if (
      !validNumber(savedSettings.taxReservePercent) ||
      !['system', 'light', 'dark'].includes(
        String(savedSettings.theme)
      ) ||
      typeof savedSettings.hideWelcome !== 'boolean'
    ) {
      return {
        success: false,
        error: 'Invalid backup settings.',
      };
    }

    const settings: AppSettings = {
      taxReservePercent: savedSettings.taxReservePercent,
      theme: savedSettings.theme as AppSettings['theme'],
      hideWelcome: savedSettings.hideWelcome,
    };

    return {
      success: true,
      projects,
      settings,
    };
  } catch {
    return {
      success: false,
      error: 'Could not parse or validate the backup file.',
    };
  }
}