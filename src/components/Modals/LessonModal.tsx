import React, { useState, useEffect } from 'react';
import { LessonSession, Student } from '../../types';
import { STUDENT_COLOR_TAGS } from '../../utils/colors';
import {
  X,
  Trash2,
  Users,
  Plus,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLesson: (lesson: LessonSession) => void;
  onDeleteLesson?: (lessonId: string) => void;
  initialLesson?: LessonSession | null;
  defaultDate?: string;
  defaultTime?: string;
  defaultStudentId?: string;
  students: Student[];
  currency: string;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  onSaveLesson,
  onDeleteLesson,
  initialLesson,
  defaultDate,
  defaultTime,
  defaultStudentId,
  students,
}) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>('');

  useEffect(() => {
    if (initialLesson) {
      setDate(initialLesson.date);
      setStartTime(initialLesson.startTime);
      setEndTime(initialLesson.endTime);
      setSelectedStudentIds(initialLesson.studentIds);
    } else {
      const initialDate = defaultDate || new Date().toISOString().split('T')[0];
      const initialStart = defaultTime || '14:00';
      const [h, m] = initialStart.split(':').map(Number);
      const endH = Math.min(23, h + 2);
      const initialEnd = `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;

      setDate(initialDate);
      setStartTime(initialStart);
      setEndTime(initialEnd);
      setSelectedStudentIds(defaultStudentId ? [defaultStudentId] : []);
    }
    setSelectedStudentToAdd('');
  }, [initialLesson, defaultDate, defaultTime, defaultStudentId, isOpen]);

  if (!isOpen) return null;

  const getStudent = (id: string) => students.find((s) => s.id === id);

  // List of enrolled students in this block
  const enrolledStudents = selectedStudentIds
    .map((id) => getStudent(id))
    .filter((s): s is Student => s !== undefined);

  // Available students to add
  const availableStudents = students.filter(
    (s) => !selectedStudentIds.includes(s.id)
  );

  const handleRemoveStudent = (studentId: string) => {
    const updatedIds = selectedStudentIds.filter((id) => id !== studentId);
    setSelectedStudentIds(updatedIds);

    // Save changes
    if (initialLesson) {
      const remainingStudents = updatedIds.map((id) => getStudent(id)).filter(Boolean) as Student[];
      const subjects = Array.from(new Set(remainingStudents.map((s) => s.defaultSubject)));
      const updatedTitle = subjects.length > 0 ? subjects.join(' / ') : 'Créneau libre';

      onSaveLesson({
        ...initialLesson,
        title: updatedTitle,
        studentIds: updatedIds,
      });
    }
  };

  const handleAddStudent = (studentId: string) => {
    if (!studentId || selectedStudentIds.includes(studentId)) return;
    const updatedIds = [...selectedStudentIds, studentId];
    setSelectedStudentIds(updatedIds);
    setSelectedStudentToAdd('');

    // Save changes
    if (initialLesson) {
      const allStudents = updatedIds.map((id) => getStudent(id)).filter(Boolean) as Student[];
      const subjects = Array.from(new Set(allStudents.map((s) => s.defaultSubject)));
      const updatedTitle = subjects.length > 0 ? subjects.join(' / ') : 'Séance';

      onSaveLesson({
        ...initialLesson,
        title: updatedTitle,
        studentIds: updatedIds,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#151518] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-white flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#18181d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">
                Élèves du créneau
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                {startTime} - {endTime} • {date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Clean Table Only */}
        <div className="p-5 space-y-4">
          {/* Simple Clean Table */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#111114]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Élève</th>
                  <th className="py-2.5 px-3">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-amber-400" /> Niveau
                    </span>
                  </th>
                  <th className="py-2.5 px-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-400" /> Matière
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {enrolledStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-neutral-500 italic">
                      Aucun élève dans ce créneau.
                    </td>
                  </tr>
                ) : (
                  enrolledStudents.map((student) => {
                    const tagStyle = STUDENT_COLOR_TAGS[student.color] || STUDENT_COLOR_TAGS.blue;

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Student Name & Handle */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{student.name}</p>
                              <p className="text-[10px] text-neutral-400 truncate">{student.handle}</p>
                            </div>
                          </div>
                        </td>

                        {/* Grade */}
                        <td className="py-2.5 px-3 text-neutral-300 font-medium whitespace-nowrap">
                          {student.grade}
                        </td>

                        {/* Lesson / Subject */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded-md border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}
                          >
                            {student.defaultSubject}
                          </span>
                        </td>

                        {/* Delete Row (X) */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student.id)}
                            className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            title={`Supprimer ${student.name} de ce créneau`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Add Student Row */}
          {availableStudents.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedStudentToAdd}
                onChange={(e) => {
                  const sid = e.target.value;
                  if (sid) handleAddStudent(sid);
                }}
                className="flex-1 bg-[#111114] border border-white/10 text-neutral-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="">+ Ajouter un élève au créneau...</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#18181d] text-white">
                    {s.name} ({s.grade} - {s.defaultSubject})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-[#18181d]">
          {initialLesson && onDeleteLesson ? (
            <button
              type="button"
              onClick={() => {
                onDeleteLesson(initialLesson.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer le créneau</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
