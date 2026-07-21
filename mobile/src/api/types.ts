export type RecurrenceType =
  | "daily"
  | "every_x_days"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "biannually"
  | "annually";

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  daily: "Daily",
  every_x_days: "Every X days",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannually: "Biannually",
  annually: "Annually",
};

export interface Person {
  id: number;
  name: string;
}

export interface Household {
  id: number;
  name: string;
  vacation_mode: boolean;
  members: Person[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  assigned_to_id: number;
  due_date: string; // YYYY-MM-DD
  time_of_day: string; // HH:MM:SS
  recurrence_type: RecurrenceType;
  every_x_days: number | null;
  last_completed_at: string | null;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  assigned_to_id: number;
  due_date: string;
  time_of_day: string;
  recurrence_type: RecurrenceType;
  every_x_days?: number | null;
}
