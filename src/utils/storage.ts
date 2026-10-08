import { Project, AppSettings } from '../types';
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
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid backup file: not a JSON object.' };
    }

    if (!Array.isArray(parsed.projects)) {
      return { success: false, error: 'Invalid backup file: missing projects list.' };
    }

    // Validate projects structure
    for (let i = 0; i < parsed.projects.length; i++) {
      const p = parsed.projects[i];
      if (!p.id || typeof p.name !== 'string') {
        return { success: false, error: `Invalid project at index ${i}: name or id missing.` };
      }
      if (p.payType !== 'hourly' && p.payType !== 'fixed') {
        p.payType = 'hourly';
      }
      p.rateOrPrice = Math.max(0, Number(p.rateOrPrice) || 0);
      p.paidHours = Math.max(0, Number(p.paidHours) || 0);
      p.unpaidHours = Math.max(0, Number(p.unpaidHours) || 0);
      if (!Array.isArray(p.payments)) {
        p.payments = [];
      } else {
        p.payments = p.payments.map((pmt: any, idx: number) => ({
          id: pmt.id || `p-${Date.now()}-${idx}`,
          amount: Math.max(0, Number(pmt.amount) || 0),
          date: pmt.date || getLocalDateString(),
          note: pmt.note || '',
        }));
      }
      if (!['offer', 'active', 'done'].includes(p.status)) {
        p.status = 'active';
      }
    }

    const settings: AppSettings = {
      taxReservePercent:
        typeof parsed.settings?.taxReservePercent === 'number' && parsed.settings.taxReservePercent >= 0
          ? parsed.settings.taxReservePercent
          : DEFAULT_SETTINGS.taxReservePercent,
      theme: ['system', 'light', 'dark'].includes(parsed.settings?.theme)
        ? parsed.settings.theme
        : DEFAULT_SETTINGS.theme,
      hideWelcome: Boolean(parsed.settings?.hideWelcome),
    };

    return {
      success: true,
      projects: parsed.projects,
      settings,
    };
  } catch (err: any) {
    return { success: false, error: `Could not parse JSON file: ${err.message}` };
  }
}
