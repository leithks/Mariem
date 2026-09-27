import React, { useState, useEffect, useMemo } from 'react';
import { Student, LessonSession, TutorProfile } from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_LESSONS,
  INITIAL_TUTOR_PROFILE,
  DEMO_SAMPLE_LESSONS,
} from './data/initialData';
import { FOUR_CONTAINER_COLORS, getNextBlockColor } from './utils/colors';
import {
  getWeekDays,
  calculateStudentEarnings,
  createClonedWeeklyLessons,
  formatDateStr,
} from './utils/calendar';
import { TutorHeader } from './components/Sidebar/TutorHeader';
import { AddStudentForm } from './components/Sidebar/AddStudentForm';
import { StudentList } from './components/Sidebar/StudentList';
import { EarningsCard } from './components/Sidebar/EarningsCard';
import { CalendarHeader } from './components/Calendar/CalendarHeader';
import { WeekView } from './components/Calendar/WeekView';
import { MonthView } from './components/Calendar/MonthView';
import { LessonModal } from './components/Modals/LessonModal';
import { StudentDetailModal } from './components/Modals/StudentDetailModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { EarningsBreakdownModal } from './components/Modals/EarningsBreakdownModal';
import { PointageModal } from './components/Modals/PointageModal';
import { Trash2 } from 'lucide-react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginPage } from './components/auth/LoginPage';
import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const [profile, setProfile] = useState<TutorProfile>(INITIAL_TUTOR_PROFILE);

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);

  const [lessons, setLessons] = useState<LessonSession[]>(INITIAL_LESSONS);

  const { session, loading } = useAuth();

  // Load data from Supabase on mount
  useEffect(() => {
    if (!session?.user) return;

    const fetchData = async () => {
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // 2. Fetch Students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('tutor_id', session.user.id);
      
      if (studentsData) setStudents(studentsData);

      // 3. Fetch Lessons
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('tutor_id', session.user.id);
      
      if (lessonsData) setLessons(lessonsData);
    };

    fetchData();
  }, [session]);

  // Sync to Supabase
  useEffect(() => {
    if (!session?.user) return;
    supabase.from('profiles').upsert({ id: session.user.id, ...profile }).then();
  }, [profile, session]);

  useEffect(() => {
    if (!session?.user) return;
    supabase.from('students').upsert(students.map(s => ({ ...s, tutor_id: session.user.id }))).then();
  }, [students, session]);

  useEffect(() => {
    if (!session?.user) return;
    supabase.from('lessons').upsert(lessons.map(l => ({ ...l, tutor_id: session.user.id }))).then();
  }, [lessons, session]);

  // Calendar view & navigation state - Default to September 2026
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 20)); // Sept 20, 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-09-20');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Modal States
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonSession | null>(null);
  const [slotPrefill, setSlotPrefill] = useState<{ date: string; time: string; studentId?: string } | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isPointageOpen, setIsPointageOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Derived Days
  const weekDays = useMemo(() => {
    return getWeekDays(currentDate);
  }, [currentDate]);

  // Earnings calculation (Monthly basis)
  const { totalEarnings: calculatedTotalEarnings, studentSummaries } = useMemo(() => {
    return calculateStudentEarnings(students, lessons, currentDate, profile.currency);
  }, [students, lessons, currentDate, profile.currency]);

  // If user entered a manual custom earnings total, prioritize it, otherwise use calculated sum
  const totalEarnings = profile.customEarningsTotal ?? calculatedTotalEarnings;

  // Today's pointage attendance count
  const todayPointageCount = useMemo(() => {
    const dateStr = formatDateStr(currentDate);
    const dayLessons = lessons.filter((l) => l.date === dateStr);
    let total = 0;
    let attended = 0;
    dayLessons.forEach((l) => {
      l.studentIds.forEach((sid) => {
        total += 1;
        if (l.attendance[sid] === 'present') attended += 1;
      });
    });
    return { attended, total };
  }, [lessons, currentDate]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!session) return <LoginPage />;

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Student Actions
  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'joinedDate'>) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `std-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
      monthlyFee: newStudentData.ratePerHour ? newStudentData.ratePerHour * 2 : 60,
    };
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleTogglePaid = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const nowPaid = !s.paid;
          return {
            ...s,
            paid: nowPaid,
            lastPaidDate: nowPaid ? new Date().toISOString().split('T')[0] : s.lastPaidDate,
          };
        }
        return s;
      })
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    // Also remove from lessons
    setLessons((prev) =>
      prev.map((lesson) => {
        const remainingStudents = lesson.studentIds.filter((id) => id !== studentId);
        return {
          ...lesson,
          studentIds: remainingStudents,
          topic: lesson.studentIds.includes(studentId) ? 'Séance' : lesson.topic,
        };
      })
    );
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const handleUpdateCustomEarningsTotal = (newTotal: number | null) => {
    setProfile((prev) => ({
      ...prev,
      customEarningsTotal: newTotal !== null ? newTotal : undefined,
    }));
  };

  const handleUpdateStudentFee = (studentId: string, newFee: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, monthlyFee: newFee } : s))
    );
  };

  // Pointage (Attendance) Handlers
  const handleToggleAttendance = (lessonId: string, studentId: string) => {
    const targetDateStr = formatDateStr(currentDate);

    setLessons((prev) => {
      // 1. If lessonId is provided and exists in current state
      const targetLesson = prev.find((l) => l.id === lessonId);
      if (targetLesson) {
        const isCurrentlyPresent = targetLesson.attendance[studentId] === 'present';
        const newStatus = isCurrentlyPresent ? 'absent' : 'present';
        const hasStudent = targetLesson.studentIds.includes(studentId);

        return prev.map((l) => {
          if (l.id === lessonId) {
            return {
              ...l,
              studentIds: hasStudent ? l.studentIds : [...l.studentIds, studentId],
              attendance: {
                ...l.attendance,
                [studentId]: newStatus,
              },
            };
          }
          return l;
        });
      }

      // 2. Otherwise find or create a lesson for today
      const todayLesson = prev.find((l) => l.date === targetDateStr);
      if (todayLesson) {
        const isCurrentlyPresent = todayLesson.attendance[studentId] === 'present';
        const newStatus = isCurrentlyPresent ? 'absent' : 'present';
        const hasStudent = todayLesson.studentIds.includes(studentId);

        return prev.map((l) => {
          if (l.id === todayLesson.id) {
            return {
              ...l,
              studentIds: hasStudent ? l.studentIds : [...l.studentIds, studentId],
              attendance: {
                ...l.attendance,
                [studentId]: newStatus,
              },
            };
          }
          return l;
        });
      }

      // 3. If no lesson exists today, create one automatically
      const student = students.find((s) => s.id === studentId);
      const newSession: LessonSession = {
        id: `lesson-${Date.now()}`,
        title: student?.defaultSubject || 'Séance',
        date: targetDateStr,
        startTime: '14:00',
        endTime: '16:00',
        studentIds: [studentId],
        color: 'blue',
        attendance: {
          [studentId]: 'present',
        },
        paidStudents: {},
      };
      return [...prev, newSession];
    });
  };

  const handleMarkAllPresent = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id === lessonId) {
          const updatedAtt = { ...l.attendance };
          l.studentIds.forEach((sid) => {
            updatedAtt[sid] = 'present';
          });
          return {
            ...l,
            attendance: updatedAtt,
          };
        }
        return l;
      })
    );
  };

  // Time Block & Lesson Actions - Cloned for all upcoming weeks
  const handleCreateTimeBlock = (dateStr: string, startTime: string, endTime: string) => {
    setLessons((prev) => {
      const nextColor = getNextBlockColor(prev);
      const baseBlock: Omit<LessonSession, 'id' | 'date'> = {
        title: 'Créneau libre',
        startTime,
        endTime,
        studentIds: [],
        color: nextColor,
        attendance: {},
        paidStudents: {},
      };

      // Clone across upcoming 16 weeks
      const clonedBlocks = createClonedWeeklyLessons(baseBlock, dateStr, 16);
      return [...prev, ...clonedBlocks];
    });
  };

  const handleSaveLesson = (savedLesson: LessonSession) => {
    setLessons((prev) => {
      const target = prev.find((l) => l.id === savedLesson.id);
      if (target && target.seriesId) {
        // Propagate updates to all upcoming instances in the series
        return prev.map((l) => {
          if (l.seriesId === target.seriesId && l.date >= savedLesson.date) {
            return {
              ...l,
              title: savedLesson.title,
              startTime: savedLesson.startTime,
              endTime: savedLesson.endTime,
              studentIds: savedLesson.studentIds,
              color: savedLesson.color,
            };
          }
          if (l.id === savedLesson.id) return savedLesson;
          return l;
        });
      }

      const exists = prev.some((l) => l.id === savedLesson.id);
      if (exists) {
        return prev.map((l) => (l.id === savedLesson.id ? savedLesson : l));
      }
      return [...prev, savedLesson];
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessons((prev) => {
      const target = prev.find((l) => l.id === lessonId);
      if (target && target.seriesId) {
        // Delete this and all upcoming instances in the series
        return prev.filter(
          (l) => !(l.seriesId === target.seriesId && l.date >= target.date)
        );
      }
      return prev.filter((l) => l.id !== lessonId);
    });
  };

  const handleSelectSlot = (dateStr: string, time: string) => {
    const [h, m] = time.split(':').map(Number);
    const endH = Math.min(23, h + 2);
    const endTime = `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
    handleCreateTimeBlock(dateStr, time, endTime);
  };

  const handleSelectLesson = (lesson: LessonSession) => {
    setEditingLesson(lesson);
    setSlotPrefill(null);
    setIsLessonModalOpen(true);
  };

  // Drag and drop: Create or drop student into slot (cloned across upcoming weeks)
  const handleDropStudentToSlot = (studentId: string, dateStr: string, startTime: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // Default 2 hours duration
    const [h, m] = startTime.split(':').map(Number);
    const endH = Math.min(23, h + 2);
    const endTime = `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
    const subjectTitle = student.defaultSubject || 'Info';

    setLessons((prev) => {
      const nextColor = getNextBlockColor(prev);
      const baseLesson: Omit<LessonSession, 'id' | 'date'> = {
        title: subjectTitle,
        startTime,
        endTime,
        studentIds: [studentId],
        color: nextColor,
        topic: `Séance ${subjectTitle} - ${student.handle}`,
        attendance: {}, // Start clean - attendance is recorded via Pointage when session happens
        paidStudents: {},
      };

      // Clone for all upcoming 16 weeks
      const recurringSessions = createClonedWeeklyLessons(baseLesson, dateStr, 16);
      return [...prev, ...recurringSessions];
    });
  };

  // Drag and drop: Add student into existing time block (and syncs to series)
  const handleAddStudentToLesson = (studentId: string, lessonId: string) => {
    const student = students.find((s) => s.id === studentId);
    setLessons((prev) => {
      const target = prev.find((l) => l.id === lessonId);
      const targetSeriesId = target?.seriesId;

      return prev.map((l) => {
        const isMatch = l.id === lessonId || (targetSeriesId && l.seriesId === targetSeriesId && l.date >= (target?.date || ''));
        if (isMatch) {
          if (l.studentIds.includes(studentId)) return l;
          const newStudentIds = [...l.studentIds, studentId];

          const enrolledStudents = newStudentIds
            .map((sid) => (sid === studentId ? student : students.find((s) => s.id === sid)))
            .filter(Boolean) as Student[];

          const distinctSubjects = Array.from(
            new Set(enrolledStudents.map((s) => s.defaultSubject).filter(Boolean))
          );

          const updatedTitle = distinctSubjects.length > 0
            ? distinctSubjects.join(' / ')
            : (student?.defaultSubject || 'Séance');

          return {
            ...l,
            title: updatedTitle,
            studentIds: newStudentIds,
          };
        }
        return l;
      });
    });
  };

  const handleClearCalendar = () => {
    setIsClearConfirmOpen(true);
  };

  const handleConfirmClear = () => {
    setLessons([]);
    setIsClearConfirmOpen(false);
  };

  const handleResetDemoData = () => {
    setStudents(INITIAL_STUDENTS);
    setLessons([]);
    setProfile(INITIAL_TUTOR_PROFILE);
    setCurrentDate(new Date(2026, 8, 20));
    setSelectedDateStr('2026-09-20');
  };

  const handleLoadDemoLessons = () => {
    setLessons(DEMO_SAMPLE_LESSONS);
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#0d0d0f] text-white p-3 sm:p-5 lg:p-6 flex items-center justify-center font-sans antialiased">
      {/* Main App Container */}
      <div className="w-full max-w-[1540px] h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
        
        {/* Left Sidebar - Fixed height with clean flex layout without overflow */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col justify-between h-full overflow-hidden gap-3">
          {/* Top Section */}
          <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-hidden">
            {/* Tutor Profile Header */}
            <div className="shrink-0">
              <TutorHeader
                profile={profile}
                onUpdateProfile={setProfile}
                onOpenSettings={() => setIsSettingsOpen(true)}
                currentDate={currentDate}
                lessons={lessons}
              />
            </div>

            {/* Add New Student Form Card */}
            <div className="shrink-0">
              <AddStudentForm
                onAddStudent={handleAddStudent}
                currency={profile.currency}
              />
            </div>

            {/* Students List Section */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#151518] border border-white/[0.07] rounded-3xl p-4 shadow-xl">
              <StudentList
                students={students}
                onTogglePaid={handleTogglePaid}
                onDeleteStudent={handleDeleteStudent}
                onSelectStudent={setSelectedStudent}
              />
            </div>
          </div>

          {/* Earnings Card at bottom (Pure visualization with direct link to detailed report) */}
          <div className="shrink-0">
            <EarningsCard
              totalEarnings={totalEarnings}
              currency={profile.currency}
              studentSummaries={studentSummaries}
              students={students}
              onSelectStudent={setSelectedStudent}
              onOpenEarningsBreakdown={() => setIsBreakdownOpen(true)}
            />
          </div>
        </aside>

        {/* Right Main Calendar Workspace */}
        <main className="lg:col-span-8 xl:col-span-9 bg-white text-neutral-900 rounded-[32px] p-4 sm:p-6 lg:p-7 shadow-2xl flex flex-col justify-between overflow-hidden h-full">
          <div className="flex flex-col h-full space-y-3">
            {/* Header with Month/Year, Pointage Circle Button, Month|Week toggle, and Nav buttons */}
            <CalendarHeader
              currentDate={currentDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onPrev={handlePrev}
              onNext={handleNext}
              onToday={handleToday}
              onOpenPointage={() => setIsPointageOpen(true)}
              todayPointageCount={todayPointageCount}
              onClearCalendar={handleClearCalendar}
            />

            {/* Calendar Grid View */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'week' ? (
                <WeekView
                  weekDays={weekDays}
                  lessons={lessons}
                  students={students}
                  onSelectLesson={handleSelectLesson}
                  onSelectSlot={handleSelectSlot}
                  onDropStudentToSlot={handleDropStudentToSlot}
                  onAddStudentToLesson={handleAddStudentToLesson}
                  onCreateTimeBlock={handleCreateTimeBlock}
                  onDeleteLesson={handleDeleteLesson}
                  selectedDateStr={selectedDateStr}
                  onSelectDate={setSelectedDateStr}
                />
              ) : (
                <MonthView
                  currentDate={currentDate}
                  lessons={lessons}
                  students={students}
                  onSelectLesson={handleSelectLesson}
                  onSelectSlot={handleSelectSlot}
                  selectedDateStr={selectedDateStr}
                  onSelectDate={setSelectedDateStr}
                  currency={profile.currency}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <LessonModal
        isOpen={isLessonModalOpen}
        onClose={() => {
          setIsLessonModalOpen(false);
          setEditingLesson(null);
          setSlotPrefill(null);
        }}
        onSaveLesson={handleSaveLesson}
        onDeleteLesson={handleDeleteLesson}
        initialLesson={editingLesson}
        defaultDate={slotPrefill?.date}
        defaultTime={slotPrefill?.time}
        defaultStudentId={slotPrefill?.studentId}
        students={students}
        currency={profile.currency}
      />

      <StudentDetailModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onUpdateStudent={handleUpdateStudent}
        onDeleteStudent={handleDeleteStudent}
        lessons={lessons}
        currency={profile.currency}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
        onResetDemoData={handleResetDemoData}
        onLoadDemoLessons={handleLoadDemoLessons}
      />

      <EarningsBreakdownModal
        isOpen={isBreakdownOpen}
        onClose={() => setIsBreakdownOpen(false)}
        students={students}
        lessons={lessons}
        currency={profile.currency}
        currentDate={currentDate}
        onUpdateStudentFee={handleUpdateStudentFee}
        onTogglePaid={handleTogglePaid}
      />

      {/* Pointage (Attendance Check) Modal Panel */}
      <PointageModal
        isOpen={isPointageOpen}
        onClose={() => setIsPointageOpen(false)}
        currentDate={currentDate}
        weekDays={weekDays.map(d => d.dateStr)}
        lessons={lessons}
        students={students}
        onToggleAttendance={handleToggleAttendance}
      />

      {/* In-app Clear Calendar Confirmation Modal */}
      {isClearConfirmOpen && (
        <div
          onClick={() => setIsClearConfirmOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181c] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold">Effacer le calendrier</h4>
                <p className="text-xs text-neutral-400">Cette action est irréversible.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Voulez-vous vraiment effacer tous les créneaux et séances du calendrier ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Oui, tout effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
