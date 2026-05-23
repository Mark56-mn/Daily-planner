export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm" in 24-hour format
  createdAt: string; // ISO string Date
  completed: boolean;
  hasReminder: boolean;
  snoozedUntil?: string; // ISO string DateTime
}

