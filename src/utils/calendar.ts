import { Student, LessonSession } from '../types';

export interface WeekDay {
  date: Date;
  dateStr: string; // "YYYY-MM-DD"
  dayName: string; // "Dimanche", "Lundi", etc.
  dayNumber: number; // 20, 16, etc.
  isToday: boolean;
  isSelected: boolean;
}

export const DAYS_OF_WEEK_FR = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

export const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function getWeekDays(anchorDate: Date): WeekDay[] {
  // Use noon to avoid any timezone/DST shift issues
  const current = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate(), 12, 0, 0);
  const dayIndex = current.getDay(); // 0 for Sunday
  const sunday = new Date(current.getTime() - dayIndex * 24 * 60 * 60 * 1000);

  const today = new Date();
  const todayStr = formatDateStr(today);

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = formatDateStr(d);
    days.push({
      date: d,
      dateStr,
      dayName: DAYS_OF_WEEK_FR[d.getDay()],
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
      isSelected: false,
    });
  }
  return days;
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatMonthYear(date: Date): string {
  const monthName = MONTH_NAMES_FR[date.getMonth()];
  return `${monthName} ${date.getFullYear()}`;
}

// Convert "14:00" to minutes from start of day
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Convert minutes (e.g. 840) to "14:00"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateDurationHours(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return Math.max(0.5, (end - start) / 60);
}

export interface StudentEarningsSummary {
  studentId: string;
  handle: string;
  totalEarned: number;
  sessionsAttended: number;
  isPaid: boolean;
  statusText: string;
  badgeType: 'green' | 'yellow' | 'pink';
}

export function calculateStudentEarnings(
  students: Student[],
  lessons: LessonSession[],
  currentMonthDate: Date,
  currency: string
): {
  totalEarnings: number;
  studentSummaries: StudentEarningsSummary[];
} {
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();

  // Filter lessons in this month
  const monthLessons = lessons.filter((l) => {
    const d = new Date(l.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const summaries: StudentEarningsSummary[] = students.map((student) => {
    const studentLessons = monthLessons.filter((l) =>
      l.studentIds.includes(student.id)
    );
    // Count sessions attended where student attended/checked in
    const attendedLessons = studentLessons.filter(
      (l) => l.attendance && l.attendance[student.id] === 'present'
    );

    // Monthly fixed fee per student (or default e.g. 60 DT or ratePerHour * 2)
    const monthlyFee = student.monthlyFee ?? (student.ratePerHour > 0 ? student.ratePerHour * 2 : 60);
    const earned = student.paid ? monthlyFee : 0;

    // Determine badge text and styling dynamically:
    // 1. Paid -> Green with +Amount (e.g. +60DT)
    // 2. Unpaid but attended -> Yellow with "A étudié X fois"
    // 3. Unpaid and not attended -> Pink with "N'a pas assisté ce mois-ci"
    let statusText = '';
    let badgeType: 'green' | 'yellow' | 'pink' = 'pink';

    if (student.paid) {
      statusText = `+${monthlyFee}${currency}`;
      badgeType = 'green';
    } else if (attendedLessons.length > 0) {
      const timesStr = attendedLessons.length === 1 ? '1 fois' : `${attendedLessons.length} fois`;
      statusText = `A étudié ${timesStr}`;
      badgeType = 'yellow';
    } else {
      statusText = "N'a pas assisté ce mois-ci";
      badgeType = 'pink';
    }

    return {
      studentId: student.id,
      handle: student.handle,
      totalEarned: earned,
      sessionsAttended: attendedLessons.length,
      isPaid: student.paid,
      statusText,
      badgeType,
    };
  });

  // Sort summaries:
  // 1. Paid (green)
  // 2. Studied (yellow), ordered by number of attended sessions descending (e.g. 5, 2, 1)
  // 3. N/A (pink - "N'a pas assisté ce mois-ci")
  summaries.sort((a, b) => {
    const priority = { green: 1, yellow: 2, pink: 3 };
    if (priority[a.badgeType] !== priority[b.badgeType]) {
      return priority[a.badgeType] - priority[b.badgeType];
    }
    if (a.badgeType === 'yellow' && b.badgeType === 'yellow') {
      return b.sessionsAttended - a.sessionsAttended;
    }
    if (a.badgeType === 'green' && b.badgeType === 'green') {
      return b.totalEarned - a.totalEarned;
    }
    return a.handle.localeCompare(b.handle);
  });

  const totalEarnings = summaries.reduce((acc, s) => acc + s.totalEarned, 0);

  return {
    totalEarnings,
    studentSummaries: summaries,
  };
}

// Generate weekly recurring instances for upcoming weeks
export function createClonedWeeklyLessons(
  base: Omit<LessonSession, 'id' | 'date'>,
  startDateStr: string,
  weeksCount = 16
): LessonSession[] {
  const seriesId = `series-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const [y, m, d] = startDateStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d, 12, 0, 0);

  const list: LessonSession[] = [];
  for (let i = 0; i < weeksCount; i++) {
    const nextDate = new Date(baseDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const dateStr = formatDateStr(nextDate);
    list.push({
      ...base,
      id: `lesson-${Date.now()}-${i}`,
      date: dateStr,
      seriesId,
      // Only the first current lesson keeps initial attendance; future weeks start clean
      attendance: i === 0 ? (base.attendance ? { ...base.attendance } : {}) : {},
      paidStudents: i === 0 ? (base.paidStudents ? { ...base.paidStudents } : {}) : {},
    });
  }
  return list;
}

