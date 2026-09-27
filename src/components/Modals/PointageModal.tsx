import React, { useState, useMemo } from 'react';
import { Student, LessonSession } from '../../types';
import { formatDateStr, timeToMinutes, DAYS_OF_WEEK_FR } from '../../utils/calendar';
import { Check, X, Clock } from 'lucide-react';

interface PointageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  weekDays: string[];
  lessons: LessonSession[];
  students: Student[];
  onToggleAttendance: (lessonId: string, studentId: string) => void;
}

// Pastel colors matching the student circles in the screenshot
const PASTEL_CIRCLE_COLORS = [
  { bg: 'bg-[#BCE0FD]', text: 'text-[#1e3a8a]', border: 'border-[#93c5fd]', activeRing: 'ring-4 ring-[#60a5fa]' }, // Blue (L)
  { bg: 'bg-[#A8ECC3]', text: 'text-[#064e3b]', border: 'border-[#86efac]', activeRing: 'ring-4 ring-[#34d399]' }, // Green (X)
  { bg: 'bg-[#FED88A]', text: 'text-[#78350f]', border: 'border-[#fde047]', activeRing: 'ring-4 ring-[#facc15]' }, // Yellow (M)
  { bg: 'bg-[#F5A3CE]', text: 'text-[#831843]', border: 'border-[#f472b6]', activeRing: 'ring-4 ring-[#ec4899]' }, // Pink (M)
];

export const PointageModal: React.FC<PointageModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  weekDays,
  lessons,
  students,
  onToggleAttendance,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | 'all'>('all');

  const targetDateStr = formatDateStr(currentDate);

  // 1. Find all lessons for current week
  const weekLessons = useMemo(() => {
    return lessons.filter((l) => weekDays.includes(l.date));
  }, [lessons, weekDays]);

  // Today's lessons for live check
  const todayLessons = useMemo(() => {
    return weekLessons.filter((l) => l.date === targetDateStr);
  }, [weekLessons, targetDateStr]);

  // Current real-world time in minutes
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isTodayDate = formatDateStr(now) === targetDateStr;

  // 2. Identify which lesson is currently live / happening right now
  const liveLesson = useMemo(() => {
    if (!isTodayDate) return null;
    return todayLessons.find((l) => {
      const startMin = timeToMinutes(l.startTime);
      const endMin = timeToMinutes(l.endTime);
      return currentMinutes >= startMin && currentMinutes <= endMin;
    });
  }, [todayLessons, currentMinutes, isTodayDate]);

  // 3. Collect students to display (declared unconditionally BEFORE any return)
  const displayedStudents = useMemo(() => {
    if (selectedSlotId === 'all') {
      if (weekLessons.length > 0) {
        // Collect all distinct students enrolled in week's lessons
        const weekStudentIds = Array.from(
          new Set(weekLessons.flatMap((l) => l.studentIds))
        );
        const enrolled = weekStudentIds
          .map((id) => students.find((s) => s.id === id))
          .filter((s): s is Student => s !== undefined);
        return enrolled.length > 0 ? enrolled : students;
      }
      return students;
    }

    const specificLesson = todayLessons.find((l) => l.id === selectedSlotId);
    if (specificLesson) {
      return specificLesson.studentIds
        .map((id) => students.find((s) => s.id === id))
        .filter((s): s is Student => s !== undefined);
    }
    return students;
  }, [selectedSlotId, todayLessons, students]);

  // Safe early return ONLY AFTER all hooks have executed
  if (!isOpen) return null;

  // Check if student is marked present in the relevant lesson
  const isStudentPresent = (studentId: string) => {
    if (selectedSlotId !== 'all') {
      const lesson = weekLessons.find((l) => l.id === selectedSlotId);
      return lesson?.attendance[studentId] === 'present';
    }

    const relevantLessons = weekLessons.filter((l) => l.studentIds.includes(studentId));
    if (relevantLessons.length > 0) {
      return relevantLessons.some((l) => l.attendance[studentId] === 'present');
    }

    const anyLesson = lessons.find((l) => l.studentIds.includes(studentId));
    return anyLesson ? anyLesson.attendance[studentId] === 'present' : false;
  };

  const handleCircleClick = (studentId: string) => {
    let targetLesson: LessonSession | undefined;

    if (selectedSlotId !== 'all') {
      targetLesson = weekLessons.find((l) => l.id === selectedSlotId);
    } else {
      // Prioritize live lesson or lesson containing student
      targetLesson =
        (liveLesson && liveLesson.studentIds.includes(studentId) ? liveLesson : undefined) ||
        weekLessons.find((l) => l.studentIds.includes(studentId)) ||
        weekLessons[0] ||
        lessons.find((l) => l.studentIds.includes(studentId)) ||
        lessons[0];
    }

    if (targetLesson) {
      onToggleAttendance(targetLesson.id, studentId);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none"
    >
      {/* Modal Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#1a1a1e] border border-white/10 rounded-[38px] p-6 sm:p-8 shadow-2xl max-w-lg w-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-150"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Time sync slots bar */}
        {weekLessons.length > 0 && (
          <div className="w-full flex items-center justify-center gap-1.5 mb-5 flex-wrap px-2">
            <button
              type="button"
              onClick={() => setSelectedSlotId('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedSlotId === 'all'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Tous ({weekLessons.reduce((acc, l) => acc + l.studentIds.length, 0)} élèves)
            </button>

            {weekLessons.map((l) => {
              const isLive = liveLesson?.id === l.id;
              const isSelected = selectedSlotId === l.id;

              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedSlotId(l.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-sm'
                      : isLive
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/90'
                      : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>{l.startTime} - {l.endTime}</span>
                  {isLive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="En cours maintenant" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Lesson Groups when "All" is selected */}
        {selectedSlotId === 'all' ? (
          <div className="w-full max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {weekLessons.map((lesson) => {
              const lessonStudents = lesson.studentIds
                .map((id) => students.find((s) => s.id === id))
                .filter((s): s is Student => s !== undefined);

              if (lessonStudents.length === 0) return null;

              return (
                <div key={lesson.id} className="space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider pl-1">
                    {(() => {
                      const d = new Date(lesson.date);
                      // Adjust for UTC/local time interpretation to ensure correct day
                      const localDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                      return DAYS_OF_WEEK_FR[localDate.getDay()];
                    })()} · {lesson.startTime} - {lesson.endTime}
                  </h4>
                  <div className="grid grid-cols-4 gap-3 w-full justify-items-center py-3 bg-white/5 rounded-2xl border border-white/5">
                    {lessonStudents.map((student, idx) => {
                      const colorScheme = PASTEL_CIRCLE_COLORS[idx % PASTEL_CIRCLE_COLORS.length];
                      const isPresent = lesson.attendance[student.id] === 'present';
                      const initial = (student.name || student.handle || 'E').replace(/^@/, '').trim().charAt(0).toUpperCase();
                      const displayName = (student.name || student.handle).replace(/^@/, '').split(' ')[0];

                      return (
                        <div
                          key={student.id}
                          onClick={() => onToggleAttendance(lesson.id, student.id)}
                          className="flex flex-col items-center gap-1.5 cursor-pointer group"
                        >
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold border-2 ${colorScheme.bg} ${colorScheme.text} ${colorScheme.border} ${isPresent ? `${colorScheme.activeRing} ring-offset-2 ring-offset-[#1a1a1e]` : 'opacity-85 hover:opacity-100'}`}>
                            {initial}
                          </div>
                          <span className={`text-[9px] font-medium text-center truncate w-[50px] ${isPresent ? 'text-white' : 'text-neutral-400'}`}>
                            {displayName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Grid for specific slot */
          displayedStudents.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-400">
              <p className="font-semibold">Aucun élève prévu sur ce créneau.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-x-5 sm:gap-x-6 gap-y-6 sm:gap-y-7 w-full justify-items-center py-2">
              {displayedStudents.map((student, idx) => {
                const colorScheme = PASTEL_CIRCLE_COLORS[idx % PASTEL_CIRCLE_COLORS.length];
                const isPresent = isStudentPresent(student.id);
                const initial = (student.name || student.handle || 'E').replace(/^@/, '').trim().charAt(0).toUpperCase();
                const displayName = (student.name || student.handle).replace(/^@/, '').split(' ')[0];

                return (
                  <div
                    key={student.id}
                    onClick={() => handleCircleClick(student.id)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="relative">
                      <div
                        className={`w-15 h-15 sm:w-17 sm:h-17 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold font-sans shadow-md transition-all duration-200 transform group-hover:scale-105 group-active:scale-95 border-2 ${
                          colorScheme.bg
                        } ${colorScheme.text} ${colorScheme.border} ${
                          isPresent ? `${colorScheme.activeRing} shadow-lg ring-offset-2 ring-offset-[#1a1a1e]` : 'opacity-85 hover:opacity-100'
                        }`}
                      >
                        {initial}
                      </div>
                      {isPresent && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-[#1a1a1e]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-medium tracking-tight text-center truncate max-w-[76px] transition-colors ${
                        isPresent ? 'text-white font-bold' : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {displayName}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};
