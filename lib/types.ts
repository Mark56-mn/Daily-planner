export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export interface Task {
  id: string;
  title: string;
  time: string; // "HH:mm" in 24-hour format
  repeatDays: DayOfWeek[];
  createdAt: string; // ISO string Date
  completedDates: string[]; // Array of "YYYY-MM-DD"
  hasReminder: boolean;
  notes?: string;
}
