import React from 'react';
import { DAYS_OF_WEEK_FR, formatDateStr } from '../../utils/calendar';
import { LessonSession, Student } from '../../types';
import { CARD_THEMES } from '../../utils/colors';

interface MonthViewProps {
  currentDate: Date;
  lessons: LessonSession[];
  students: Student[];
  onSelectLesson: (lesson: LessonSession) => void;
  onSelectSlot: (dateStr: string, time: string) => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  currency: string;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  lessons,
  students,
  onSelectLesson,
  onSelectSlot,
  selectedDateStr,
  onSelectDate,
  currency,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month
  const firstDay = new Date(year, month, 1);
  const startingDayIndex = firstDay.getDay(); // 0 for Sunday

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days in previous month for padding
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarCells: {
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  const todayStr = formatDateStr(new Date());

  // Padding days from previous month
  for (let i = startingDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = formatDateStr(prevDate);
    calendarCells.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(year, month, d);
    const dateStr = formatDateStr(dObj);
    calendarCells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Padding for next month to complete rows of 7
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    const nextDate = new Date(year, month + 1, n);
    const dateStr = formatDateStr(nextDate);
    calendarCells.push({
      dateStr,
      dayNum: n,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  const getStudent = (id: string) => students.find((s) => s.id === id);

  return (
    <div className="space-y-3 pt-2 overflow-y-auto max-h-[520px] lg:max-h-[calc(100vh-270px)] pr-1 custom-scrollbar">
      {/* Day Names Row */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK_FR.map((dayName) => (
          <div
            key={dayName}
            className="text-center py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider"
          >
            {dayName.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((cell) => {
          const dayLessons = lessons.filter((l) => l.date === cell.dateStr);
          const isSelected = cell.dateStr === selectedDateStr;

          // Estimate day earnings
          let dayEarnings = 0;
          dayLessons.forEach((l) => {
            l.studentIds.forEach((sid) => {
              const s = getStudent(sid);
              const rate = l.ratePerStudent ?? s?.ratePerHour ?? 30;
              dayEarnings += rate * 2;
            });
          });

          return (
            <div
              key={cell.dateStr}
              onClick={() => {
                onSelectDate(cell.dateStr);
                if (dayLessons.length === 0) {
                  onSelectSlot(cell.dateStr, '14:00');
                }
              }}
              className={`min-h-[100px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-50/90 shadow-xs ring-1 ring-neutral-900'
                  : cell.isCurrentMonth
                  ? 'border-neutral-100 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                  : 'border-transparent bg-neutral-50/40 opacity-40 hover:opacity-75'
              }`}
            >
              {/* Top: Day number & Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold font-mono ${
                    cell.isToday
                      ? 'w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center'
                      : cell.isCurrentMonth
                      ? 'text-neutral-900'
                      : 'text-neutral-400'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {dayEarnings > 0 && cell.isCurrentMonth && (
                  <span className="text-[10px] font-bold font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    +{dayEarnings} {currency}
                  </span>
                )}
              </div>

              {/* Middle: Lessons List */}
              <div className="space-y-1 my-1 overflow-hidden">
                {dayLessons.slice(0, 2).map((lesson) => {
                  const theme = CARD_THEMES[lesson.color] || CARD_THEMES.blue;
                  return (
                    <div
                      key={lesson.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLesson(lesson);
                      }}
                      className={`text-[10px] font-semibold px-1.5 py-1 rounded-lg truncate border ${theme.bg} ${theme.text} ${theme.border} hover:opacity-90 transition-opacity`}
                      title={`${lesson.title} (${lesson.startTime} - ${lesson.endTime})`}
                    >
                      {lesson.startTime} {lesson.title}
                    </div>
                  );
                })}
                {dayLessons.length > 2 && (
                  <span className="text-[9px] font-medium text-neutral-500 pl-1">
                    +{dayLessons.length - 2} autres
                  </span>
                )}
              </div>

              {/* Bottom: Quick Add action button */}
              <div className="text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSlot(cell.dateStr, '14:00');
                  }}
                  className="text-[10px] font-medium text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  + Ajouter
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
