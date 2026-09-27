export type ColorTheme = 'blue' | 'yellow' | 'pink' | 'green' | 'purple' | 'orange';

export interface Student {
  id: string;
  handle: string; // e.g., "@mariem"
  name: string;
  grade: string; // e.g., "Bac", "3rd Year"
  defaultSubject: string; // e.g., "Informatique"
  ratePerHour: number; // e.g., 30
  monthlyFee?: number; // e.g., 60 (Monthly tuition amount)
  paid: boolean;
  color: ColorTheme;
  customStatus?: string; // Optional manual override
  phone?: string;
  parentPhone?: string;
  notes?: string;
  joinedDate: string;
  lastPaidDate?: string;
}

export interface LessonSession {
  id: string;
  title: string; // e.g., "Informatique"
  date: string; // "YYYY-MM-DD" e.g., "2026-09-20"
  startTime: string; // "14:00"
  endTime: string; // "16:00"
  studentIds: string[];
  color: ColorTheme;
  ratePerStudent?: number; // Override rate for this session if different
  attendance: Record<string, 'present' | 'absent' | 'excused'>; // studentId -> status
  paidStudents: Record<string, boolean>; // studentId -> has paid
  topic?: string;
  notes?: string;
  location?: string;
  seriesId?: string; // Links recurring weekly instances
}

export interface TutorProfile {
  name: string;
  tagline: string;
  currency: string;
  defaultHourlyRate: number;
  avatarUrl: string;
  customEarningsTotal?: number; // Optional manual override for total monthly earnings
}
