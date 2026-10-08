export type PayType = 'hourly' | 'fixed';

export type ProjectStatus = 'offer' | 'active' | 'done';

export interface Payment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  payType: PayType;
  rateOrPrice: number; // Hourly rate or Fixed project price (>= 0)
  paidHours: number; // Paid work hours (>= 0)
  unpaidHours: number; // Optional unpaid/admin hours (>= 0)
  payments: Payment[];
  status: ProjectStatus;
  nextAction: string;
  reminderDateTime: string; // YYYY-MM-DDTHH:mm or empty
  dueDate: string; // YYYY-MM-DD or empty
  notes: string;
  createdAt: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  taxReservePercent: number; // default 30 (>= 0)
  theme: ThemeMode;
  hideWelcome: boolean;
}

export interface ProjectCalculations {
  earned: number;
  paid: number;
  owed: number;
  estimatedTaxSavings: number;
  availableAfterReserve: number;
  totalHoursSpent: number;
  realHourlyRate: number | null; // null if totalHoursSpent === 0 -> "Not available yet"
}

export interface AttentionItem {
  id: string;
  projectId: string;
  projectName: string;
  client: string;
  type: 'reminder' | 'next_action' | 'due_soon' | 'payment_owed' | 'payment_overdue';
  title: string;
  detail: string;
  dueDate?: string;
  reminderDateTime?: string;
  amountOwed?: number;
}
