import React, { useState, useRef, useCallback, useMemo } from 'react';
import { WeekDay, timeToMinutes, minutesToTime } from '../../utils/calendar';
import { LessonSession, Student, ColorTheme } from '../../types';
import { CARD_THEMES, getNextBlockColor } from '../../utils/colors';
import { Trash2, Plus, Clock, Sparkles } from 'lucide-react';

interface WeekViewProps {
  weekDays: WeekDay[];
  lessons: LessonSession[];
  students: Student[];
  onSelectLesson: (lesson: LessonSession) => void;
  onSelectSlot: (dateStr: string, time: string) => void;
  onDropStudentToSlot: (studentId: string, dateStr: string, startTime: string) => void;
  onAddStudentToLesson: (studentId: string, lessonId: string) => void;
  onCreateTimeBlock: (dateStr: string, startTime: string, endTime: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
}

// 4 loop colors: Blue -> Green -> Yellow -> Pink
export const CONTAINER_COLOR_CYCLE: ColorTheme[] = ['blue', 'green', 'yellow', 'pink'];

// Time slots: Standard (14h - 20h) or All hours (08h - 22h)
const DEFAULT_HOURS = [14, 15, 16, 17, 18, 19, 20];
const ALL_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export const WeekView: React.FC<WeekViewProps> = ({
  weekDays,
  lessons,
  students,
  onSelectLesson,
  onSelectSlot: _onSelectSlot,
  onDropStudentToSlot,
  onAddStudentToLesson,
  onCreateTimeBlock,
  onDeleteLesson,
  selectedDateStr,
  onSelectDate,
}) => {
  // Default to true (Tous les horaires: 08h - 22h)
  const [showAllHours, setShowAllHours] = useState(true);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [dragOverLessonId, setDragOverLessonId] = useState<string | null>(null);

  // Google Calendar-style hover & drag line state
  const [hoverState, setHoverState] = useState<{
    dateStr: string;
    dayIndex: number;
    snappedMinutes: number;
    timeStr: string;
    endDefaultStr: string;
    topPercent: number;
    heightPercent: number;
  } | null>(null);

  // Drag-to-create time block state
  const [dragSelection, setDragSelection] = useState<{
    dateStr: string;
    dayIndex: number;
    startMinutes: number;
    currentMinutes: number;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const activeHours = showAllHours ? ALL_HOURS : DEFAULT_HOURS;
  const startHour = activeHours[0];
  const endHour = activeHours[activeHours.length - 1] + 1;

  const getStudent = (id: string) => students.find((s) => s.id === id);

  const getStudentInitial = (student?: Student) => {
    if (!student) return '';
    const clean = (student.name || student.handle || '').replace(/^@/, '').trim();
    return clean ? clean.charAt(0).toUpperCase() : '';
  };

  // -------------------------------------------------------------
  // Dynamic Hour Gap Calculation (Accordion / Smart Proportional Spacing)
  // -------------------------------------------------------------
  // When blocks are placed (e.g. at 8h and 20h), active hours get high weight
  // while empty intermediate hours compress their gap dynamically.
  const { hourTops, hourHeights } = useMemo(() => {
    const visibleLessons = lessons.filter((l) =>
      weekDays.some((w) => w.dateStr === l.date)
    );

    // Track which hours contain lessons
    const hourHasLesson: Record<number, boolean> = {};
    for (const h of activeHours) {
      hourHasLesson[h] = false;
    }

    visibleLessons.forEach((l) => {
      const startMin = timeToMinutes(l.startTime);
      const endMin = timeToMinutes(l.endTime);
      for (const h of activeHours) {
        const slotStart = h * 60;
        const slotEnd = (h + 1) * 60;
        if (startMin < slotEnd && endMin > slotStart) {
          hourHasLesson[h] = true;
        }
      }
    });

    const hasAnyLesson = Object.values(hourHasLesson).some(Boolean);

    // Compute weights
    const weights: Record<number, number> = {};
    let totalWeight = 0;

    activeHours.forEach((h) => {
      if (!hasAnyLesson) {
        weights[h] = 1.0;
      } else if (hourHasLesson[h]) {
        weights[h] = 2.8; // Generous height for active blocks
      } else if (hourHasLesson[h - 1] || hourHasLesson[h + 1]) {
        weights[h] = 1.1; // Moderate height for buffer hours
      } else {
        weights[h] = 0.52; // Compressed gap for empty intermediate hours
      }
      totalWeight += weights[h];
    });

    // Compute cumulative top percentages and heights
    const tops: Record<number, number> = {};
    const heights: Record<number, number> = {};
    let runningPercent = 0;

    activeHours.forEach((h) => {
      const hHeight = (weights[h] / totalWeight) * 100;
      tops[h] = runningPercent;
      heights[h] = hHeight;
      runningPercent += hHeight;
    });

    // Final boundary
    tops[endHour] = 100;

    return { hourTops: tops, hourHeights: heights };
  }, [lessons, weekDays, activeHours, endHour]);

  // Convert minutes from midnight to Y percentage
  const timeToPercent = useCallback(
    (minutes: number): number => {
      const clampedMin = Math.max(startHour * 60, Math.min(endHour * 60, minutes));
      const h = Math.floor(clampedMin / 60);
      const m = clampedMin % 60;

      if (h >= endHour) return 100;
      if (h < startHour) return 0;

      const top = hourTops[h] ?? 0;
      const height = hourHeights[h] ?? (100 / activeHours.length);
      return top + (m / 60) * height;
    },
    [startHour, endHour, hourTops, hourHeights, activeHours.length]
  );

  // Convert Y percentage (or mouse Y) to snapped minutes from midnight
  const calculateSnappedTime = useCallback(
    (offsetY: number, gridHeight: number) => {
      const validHeight = Math.max(gridHeight, 1);
      const clampedY = Math.max(0, Math.min(offsetY, validHeight));
      const targetPercent = (clampedY / validHeight) * 100;

      // Find corresponding hour
      let matchedHour = activeHours[0];
      for (const h of activeHours) {
        const top = hourTops[h] ?? 0;
        const nextTop = hourTops[h + 1] ?? 100;
        if (targetPercent >= top && targetPercent < nextTop) {
          matchedHour = h;
          break;
        }
      }

      const hourTop = hourTops[matchedHour] ?? 0;
      const hourHeight = Math.max(0.001, hourHeights[matchedHour] ?? 1);
      const fracInHour = Math.max(0, Math.min(1, (targetPercent - hourTop) / hourHeight));
      const rawMinutesInHour = fracInHour * 60;

      // Snap to 0 or 30 min
      const snappedMinInHour = Math.round(rawMinutesInHour / 30) * 30;
      const boundedTotalMin = Math.max(
        startHour * 60,
        Math.min((endHour - 1) * 60 + 30, matchedHour * 60 + snappedMinInHour)
      );

      const topPercent = timeToPercent(boundedTotalMin);
      const endDefaultMin = Math.min(23 * 60 + 59, boundedTotalMin + 120);
      const heightPercent = timeToPercent(endDefaultMin) - topPercent;

      return {
        snappedMinutes: boundedTotalMin,
        topPercent,
        heightPercent: Math.max(6, heightPercent),
      };
    },
    [activeHours, hourTops, hourHeights, startHour, endHour, timeToPercent]
  );

  // Mouse move over calendar grid: track line and dynamic hover guide
  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;

    const target = e.target as HTMLElement;
    if (target.closest('[data-lesson-card]') || target.closest('button')) {
      if (!dragSelection) {
        setHoverState(null);
      }
      return;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 52; // 52px left time gutter
    const y = e.clientY - rect.top;

    if (x < 0) {
      setHoverState(null);
      return;
    }

    const colWidth = (rect.width - 52) / 7;
    const dayIndex = Math.max(0, Math.min(6, Math.floor(x / colWidth)));
    const currentDay = weekDays[dayIndex];

    if (!currentDay) {
      setHoverState(null);
      return;
    }

    const { snappedMinutes, topPercent, heightPercent } = calculateSnappedTime(y, rect.height);
    const timeStr = minutesToTime(snappedMinutes);
    const endMinutes = Math.min(23 * 60 + 59, snappedMinutes + 120);
    const endDefaultStr = minutesToTime(endMinutes);

    if (dragSelection) {
      setDragSelection((prev) => (prev ? { ...prev, currentMinutes: snappedMinutes } : null));
    } else {
      setHoverState({
        dateStr: currentDay.dateStr,
        dayIndex,
        snappedMinutes,
        timeStr,
        endDefaultStr,
        topPercent,
        heightPercent,
      });
    }
  };

  const handleGridMouseLeave = () => {
    if (!dragSelection) {
      setHoverState(null);
    }
  };

  // Click or drag down on line to create time block
  const handleGridMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !gridRef.current) return;

    const target = e.target as HTMLElement;
    if (target.closest('[data-lesson-card]') || target.closest('button')) {
      return;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 52;
    const y = e.clientY - rect.top;
    if (x < 0) return;

    const colWidth = (rect.width - 52) / 7;
    const dayIndex = Math.max(0, Math.min(6, Math.floor(x / colWidth)));
    const currentDay = weekDays[dayIndex];
    if (!currentDay) return;

    const { snappedMinutes } = calculateSnappedTime(y, rect.height);

    setDragSelection({
      dateStr: currentDay.dateStr,
      dayIndex,
      startMinutes: snappedMinutes,
      currentMinutes: snappedMinutes + 120, // 2-hour default
    });
  };

  const handleGridMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!dragSelection && (target.closest('[data-lesson-card]') || target.closest('button'))) {
      return;
    }

    if (dragSelection) {
      const minM = Math.min(dragSelection.startMinutes, dragSelection.currentMinutes);
      let maxM = Math.max(dragSelection.startMinutes, dragSelection.currentMinutes);
      if (minM === maxM) {
        maxM = minM + 120;
      }

      const startTime = minutesToTime(minM);
      const endTime = minutesToTime(maxM);
      onCreateTimeBlock(dragSelection.dateStr, startTime, endTime);
      setDragSelection(null);
      setHoverState(null);
    }
  };

  // Drag-and-drop students handlers
  const handleDragOverCell = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverSlot !== slotKey) {
      setDragOverSlot(slotKey);
    }
  };

  const handleDragLeaveCell = () => {
    setDragOverSlot(null);
  };

  const handleDropCell = (e: React.DragEvent, dateStr: string, hour: number) => {
    e.preventDefault();
    setDragOverSlot(null);

    const studentId =
      e.dataTransfer.getData('text/plain') ||
      (() => {
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          return data.studentId;
        } catch {
          return null;
        }
      })();

    if (studentId) {
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      onDropStudentToSlot(studentId, dateStr, startTime);
    }
  };

  const handleDropOnLesson = (e: React.DragEvent, lessonId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLessonId(null);

    const studentId =
      e.dataTransfer.getData('text/plain') ||
      (() => {
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          return data.studentId;
        } catch {
          return null;
        }
      })();

    if (studentId) {
      onAddStudentToLesson(studentId, lessonId);
    }
  };

  // Next container color preview for hover ghost box (alternates: blue -> green -> yellow -> pink)
  const nextLoopColor = getNextBlockColor(lessons);
  const nextTheme = CARD_THEMES[nextLoopColor];

  return (
    <div className="flex flex-col h-full space-y-2 select-none overflow-hidden">
      {/* Top Utility Row */}
      <div className="flex items-center justify-between px-1 text-xs text-neutral-500 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-medium text-neutral-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Échelle dynamique intelligente : les heures vides se compressent automatiquement
          </span>
        </div>

        <button
          onClick={() => setShowAllHours(!showAllHours)}
          className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200/80 px-2.5 py-1 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          {showAllHours ? 'Standard (14h - 20h)' : 'Tous les horaires (08h - 22h)'}
        </button>
      </div>

      {/* 7-Days Header Row - Aligned with timetable columns */}
      <div className="flex items-stretch shrink-0 pr-1">
        {/* Empty left gutter matching time labels width */}
        <div className="w-13 shrink-0" />

        {/* 7 Day Column Headers (Non-clickable, highlighting today's current day) */}
        <div className="flex-1 grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isToday = day.isToday;

            return (
              <div
                key={day.dateStr}
                className={`rounded-2xl p-1.5 sm:p-2 text-center flex flex-col items-center justify-center gap-0.5 select-none transition-all ${
                  isToday
                    ? 'bg-[#232326] text-white shadow-md ring-2 ring-blue-500/40'
                    : 'bg-[#f4f5f8] text-neutral-800'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={`text-[11px] font-medium tracking-tight ${
                      isToday ? 'text-blue-300 font-semibold' : 'text-neutral-500'
                    }`}
                  >
                    {day.dayName}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" title="Aujourd'hui" />
                  )}
                </div>
                <span
                  className={`text-lg sm:text-xl font-bold font-mono tabular-nums leading-tight ${
                    isToday ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {day.dayNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timetable Single-Viewport Dynamic Scaled Container */}
      <div className="relative border-t border-neutral-200/60 flex-1 min-h-[440px] h-full overflow-hidden pr-1 pt-2">
        <div
          ref={gridRef}
          onMouseMove={handleGridMouseMove}
          onMouseLeave={handleGridMouseLeave}
          onMouseDown={handleGridMouseDown}
          onMouseUp={handleGridMouseUp}
          className="relative w-full h-full min-w-[620px] cursor-pointer"
        >
          {/* Horizontal Hour Lines & Slots - Dynamic accordion heights */}
          {activeHours.map((hour) => {
            const formattedLabel = `${hour}h`;
            const topPct = hourTops[hour] ?? 0;
            const heightPct = hourHeights[hour] ?? (100 / activeHours.length);
            const isCompact = heightPct < 5;
            const isFirstHour = hour === activeHours[0];

            return (
              <div
                key={hour}
                className={`absolute left-0 right-0 flex items-start border-b border-neutral-200/50 transition-all duration-300 ${
                  isCompact ? 'opacity-65' : 'opacity-100'
                }`}
                style={{
                  top: `${topPct}%`,
                  height: `${heightPct}%`,
                }}
              >
                {/* Time Label on Left */}
                <span
                  className={`w-13 font-mono shrink-0 select-none pointer-events-none transition-all ${
                    isFirstHour ? 'mt-0' : '-mt-2'
                  } ${
                    isCompact
                      ? 'text-[9.5px] font-normal text-neutral-400 opacity-60'
                      : 'text-[11px] font-medium text-neutral-500'
                  }`}
                >
                  {formattedLabel}
                </span>

                {/* 7-Day Drop & Click Cells */}
                <div className="flex-1 grid grid-cols-7 h-full gap-2 pointer-events-auto">
                  {weekDays.map((day) => {
                    const slotKey = `${day.dateStr}_${hour}`;
                    const isDragOver = dragOverSlot === slotKey;

                    return (
                      <div
                        key={day.dateStr}
                        onDragOver={(e) => handleDragOverCell(e, slotKey)}
                        onDragLeave={handleDragLeaveCell}
                        onDrop={(e) => handleDropCell(e, day.dateStr, hour)}
                        className={`h-full rounded-xl transition-all relative ${
                          isDragOver
                            ? 'bg-blue-100/80 border-2 border-dashed border-blue-500 scale-[0.98]'
                            : ''
                        }`}
                      >
                        {isDragOver && (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-700 bg-blue-50/90 rounded-xl shadow-xs z-30">
                            + Créer {hour}:00
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Google Calendar-Style Blue Line Guide & Ghost Preview */}
          {hoverState && !dragSelection && (
            <>
              {/* Horizontal Line Across the Hovered Day Column */}
              <div
                className="absolute left-13 right-0 pointer-events-none z-20 flex items-center"
                style={{ top: `${hoverState.topPercent}%` }}
              >
                <div
                  className="grid grid-cols-7 gap-2 w-full"
                  style={{
                    gridColumnStart: hoverState.dayIndex + 1,
                  }}
                >
                  <div
                    style={{ gridColumnStart: hoverState.dayIndex + 1 }}
                    className="relative flex items-center"
                  >
                    <div className="w-full h-0.5 bg-blue-500 shadow-sm" />
                    <span className="absolute -left-1.5 -top-2.5 bg-blue-600 text-white text-[9.5px] font-bold font-mono px-1.5 py-0.5 rounded-md shadow-sm">
                      {hoverState.timeStr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ghost Preview Container */}
              <div
                className="absolute left-13 right-0 pointer-events-none z-20 grid grid-cols-7 gap-2"
                style={{
                  top: `${hoverState.topPercent}%`,
                  height: `${hoverState.heightPercent}%`,
                }}
              >
                <div
                  style={{ gridColumnStart: hoverState.dayIndex + 1 }}
                  className={`rounded-2xl p-2 border-2 border-dashed ${nextTheme.border} ${nextTheme.bg}/70 ${nextTheme.text} flex flex-col justify-between shadow-xs transition-all duration-150`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px]">Nouveau créneau</span>
                      <Plus className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-mono opacity-80">
                      {hoverState.timeStr} - {hoverState.endDefaultStr}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-medium opacity-75">
                    <span>Cliquez pour placer</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Drag Selection Box (Drawing a custom block) */}
          {dragSelection && (
            <div
              className="absolute left-13 right-0 pointer-events-none z-20 grid grid-cols-7 gap-2"
              style={{
                top: `${timeToPercent(
                  Math.min(dragSelection.startMinutes, dragSelection.currentMinutes)
                )}%`,
                height: `${Math.max(
                  4,
                  timeToPercent(
                    Math.max(dragSelection.startMinutes, dragSelection.currentMinutes)
                  ) -
                    timeToPercent(
                      Math.min(dragSelection.startMinutes, dragSelection.currentMinutes)
                    )
                )}%`,
              }}
            >
              <div
                style={{ gridColumnStart: dragSelection.dayIndex + 1 }}
                className={`rounded-2xl p-2 border-2 border-solid ${nextTheme.border} ${nextTheme.bg} ${nextTheme.text} shadow-md flex flex-col justify-between`}
              >
                <div>
                  <span className="font-bold text-[11px]">Nouveau créneau</span>
                  <p className="text-[10px] font-mono font-bold">
                    {minutesToTime(
                      Math.min(dragSelection.startMinutes, dragSelection.currentMinutes)
                    )}{' '}
                    -{' '}
                    {minutesToTime(
                      Math.max(dragSelection.startMinutes, dragSelection.currentMinutes)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lesson & Time Block Cards Layer */}
          <div className="absolute top-0 left-13 right-0 bottom-0 pointer-events-none grid grid-cols-7 gap-2">
            {weekDays.map((day, dayIndex) => {
              const dayLessons = lessons.filter((l) => l.date === day.dateStr);

              return (
                <div
                  key={day.dateStr}
                  className="relative h-full pointer-events-auto"
                  style={{ gridColumnStart: dayIndex + 1 }}
                >
                  {dayLessons.map((lesson) => {
                    const startMin = timeToMinutes(lesson.startTime);
                    const endMin = timeToMinutes(lesson.endTime);

                    const gridStartMin = startHour * 60;
                    const gridEndMin = endHour * 60;

                    if (endMin <= gridStartMin || startMin >= gridEndMin) {
                      return null;
                    }

                    const clampedStart = Math.max(startMin, gridStartMin);
                    const clampedEnd = Math.min(endMin, gridEndMin);

                    const topPercent = timeToPercent(clampedStart);
                    const heightPercent = timeToPercent(clampedEnd) - topPercent;

                    const theme = CARD_THEMES[lesson.color] || CARD_THEMES.blue;
                    const isDragOverThis = dragOverLessonId === lesson.id;

                    // Multi-student display logic: Show max 2 names + remainder pill (+N)
                    const maxVisibleNames = 2;
                    const visibleStudentIds = lesson.studentIds.slice(0, maxVisibleNames);
                    const remainingStudentCount = Math.max(0, lesson.studentIds.length - maxVisibleNames);

                    const remainingStudentsNames = lesson.studentIds
                      .slice(maxVisibleNames)
                      .map((sid) => getStudent(sid)?.name || sid)
                      .join(', ');

                    // Circle avatars logic: Show max 3 initials + remainder circle (+N)
                    const maxVisibleCircles = 3;
                    const visibleCircleIds = lesson.studentIds.slice(0, maxVisibleCircles);
                    const remainingCircleCount = Math.max(0, lesson.studentIds.length - maxVisibleCircles);

                    return (
                      <div
                        key={lesson.id}
                        data-lesson-card="true"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLesson(lesson);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverLessonId(lesson.id);
                        }}
                        onDragLeave={() => setDragOverLessonId(null)}
                        onDrop={(e) => handleDropOnLesson(e, lesson.id)}
                        className={`absolute left-0 right-0 rounded-2xl p-2.5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] cursor-pointer border ${
                          theme.bg
                        } ${theme.text} ${theme.border} overflow-hidden flex flex-col justify-between group/card ${
                          isDragOverThis ? 'ring-3 ring-blue-500 scale-[1.03]' : ''
                        }`}
                        style={{
                          top: `${topPercent}%`,
                          height: `calc(${heightPercent}% - 3px)`,
                          minHeight: '56px',
                          zIndex: 10,
                        }}
                      >
                        {/* Card Top: Subject & Time */}
                        <div className="space-y-0.5">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs tracking-tight truncate">
                              {(() => {
                                if (lesson.studentIds.length === 0) return lesson.title || 'Créneau libre';
                                const subs = Array.from(
                                  new Set(
                                    lesson.studentIds
                                      .map((sid) => getStudent(sid)?.defaultSubject)
                                      .filter(Boolean)
                                  )
                                );
                                return subs.length > 0 ? subs.join(' / ') : (lesson.title || 'Séance');
                              })()}
                            </h4>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                              onMouseUp={(e) => {
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onDeleteLesson(lesson.id);
                              }}
                              className="opacity-0 group-hover/card:opacity-100 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer rounded"
                              title="Supprimer ce créneau"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[10.5px] font-medium opacity-80 font-mono">
                            {lesson.startTime} - {lesson.endTime}
                          </p>

                          {/* Student Names Pills with +N handling when container has many students */}
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {visibleStudentIds.map((sid) => {
                              const student = getStudent(sid);
                              return (
                                <span
                                  key={sid}
                                  className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full truncate max-w-[85px] ${theme.badgeBg} ${theme.badgeText}`}
                                  title={student ? student.name : sid}
                                >
                                  {student ? student.handle : sid}
                                </span>
                              );
                            })}
                            {remainingStudentCount > 0 && (
                              <span
                                className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}
                                title={`+${remainingStudentCount} : ${remainingStudentsNames}`}
                              >
                                +{remainingStudentCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Bottom: Avatar Circles containing student's First Letter and +N circle */}
                        <div className="flex items-center -space-x-1.5 pt-1">
                          {visibleCircleIds.map((sid) => {
                            const student = getStudent(sid);
                            const initial = getStudentInitial(student);

                            return (
                              <div
                                key={sid}
                                className="w-5.5 h-5.5 rounded-full bg-white/95 border border-white text-neutral-900 font-bold text-[10px] shadow-xs flex items-center justify-center select-none shrink-0"
                                title={student ? `${student.name} (${student.handle})` : sid}
                              >
                                {initial}
                              </div>
                            );
                          })}

                          {/* Remainder circle if more students (e.g. +2) */}
                          {remainingCircleCount > 0 && (
                            <div
                              className="w-5.5 h-5.5 rounded-full bg-neutral-900 text-white border border-white font-bold text-[9px] shadow-xs flex items-center justify-center select-none shrink-0"
                              title={`+${remainingCircleCount} autres élèves : ${remainingStudentsNames}`}
                            >
                              +{remainingCircleCount}
                            </div>
                          )}

                          {/* If no students yet, show prompt */}
                          {lesson.studentIds.length === 0 && (
                            <div className="flex items-center gap-1 text-[9.5px] text-neutral-600/80 font-medium">
                              <div className="w-4.5 h-4.5 rounded-full bg-white/50 border border-dashed border-neutral-400 flex items-center justify-center text-[8.5px]">
                                +
                              </div>
                              <span className="text-[9px]">Glisser élève</span>
                            </div>
                          )}

                          {/* Decorative secondary circle if 1 or 2 students and no remainder */}
                          {lesson.studentIds.length > 0 && lesson.studentIds.length < 2 && (
                            <div className="w-5.5 h-5.5 rounded-full bg-white/35 border border-white/40 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
