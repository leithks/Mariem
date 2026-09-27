import React from 'react';
import { Student } from '../../types';
import { STUDENT_COLOR_TAGS } from '../../utils/colors';
import { X, Check, GripVertical } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  onTogglePaid: (studentId: string) => void;
  onDeleteStudent: (studentId: string) => void;
  onSelectStudent: (student: Student) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  onTogglePaid,
  onDeleteStudent,
  onSelectStudent,
}) => {
  const handleDragStart = (e: React.DragEvent, student: Student) => {
    const dragPayload = {
      type: 'student',
      studentId: student.id,
      handle: student.handle,
      subject: student.defaultSubject,
      grade: student.grade,
      color: student.color,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    e.dataTransfer.setData('text/plain', student.id);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <div className="flex flex-col min-h-0 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span className="font-mono text-lg">{students.length}</span> Élèves
        </h3>
        <span className="text-[10.5px] text-neutral-400 font-medium">
          Glisser sur l'agenda
        </span>
      </div>

      {/* Internal Scrollable List to prevent sidebar overflow */}
      <div className="space-y-1.5 max-h-[170px] sm:max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
        {students.length === 0 ? (
          <div className="py-4 text-center text-xs text-neutral-500 border border-dashed border-white/10 rounded-2xl">
            Aucun élève enregistré.
          </div>
        ) : (
          students.map((student) => {
            const colorStyle = STUDENT_COLOR_TAGS[student.color] || STUDENT_COLOR_TAGS.blue;

            return (
              <div
                key={student.id}
                className="group flex items-center justify-between py-1 px-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                {/* Student Handle Chip - Draggable */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, student)}
                  onClick={() => onSelectStudent(student)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} transition-all hover:scale-105 cursor-grab active:cursor-grabbing select-none shadow-xs truncate max-w-[150px]`}
                  title={`Glisser sur le calendrier ou cliquer pour voir la fiche (${student.grade} - ${student.defaultSubject})`}
                >
                  <GripVertical className="w-2.5 h-2.5 opacity-40 group-hover:opacity-80 shrink-0" />
                  <span className="truncate">{student.handle}</span>
                </div>

                {/* Right side: Paid / Mark as paid & Delete button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {student.paid ? (
                    <button
                      onClick={() => onTogglePaid(student.id)}
                      className="px-2 py-0.5 rounded-full text-[10.5px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 hover:bg-emerald-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Statut : Payé. Cliquer pour modifier."
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      Payé
                    </button>
                  ) : (
                    <button
                      onClick={() => onTogglePaid(student.id)}
                      className="px-2 py-0.5 rounded-full text-[10.5px] font-medium text-neutral-300 bg-[#1e1e23] border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                      title="Marquer comme payé ce mois"
                    >
                      Non payé
                    </button>
                  )}

                  {/* Delete button (x) */}
                  <button
                    onClick={() => onDeleteStudent(student.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                    title={`Supprimer ${student.handle}`}
                    aria-label={`Supprimer ${student.handle}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
