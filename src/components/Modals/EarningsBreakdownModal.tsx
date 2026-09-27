import React, { useState } from 'react';
import { Student, LessonSession } from '../../types';
import { MONTH_NAMES_FR } from '../../utils/calendar';
import { X, Download, CheckCircle2, AlertCircle, Edit2, Check } from 'lucide-react';

interface EarningsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  lessons: LessonSession[];
  currentDate: Date;
  currency: string;
  onUpdateStudentFee?: (studentId: string, newFee: number) => void;
  onTogglePaid?: (studentId: string) => void;
}

export const EarningsBreakdownModal: React.FC<EarningsBreakdownModalProps> = ({
  isOpen,
  onClose,
  students,
  lessons,
  currentDate,
  currency,
  onUpdateStudentFee,
  onTogglePaid,
}) => {
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentFeeInput, setEditStudentFeeInput] = useState('');

  if (!isOpen) return null;

  const monthName = MONTH_NAMES_FR[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthLessons = lessons.filter((l) => {
    const d = new Date(l.date);
    return d.getFullYear() === year && d.getMonth() === currentMonth;
  });

  const handleSaveStudentFee = (studentId: string) => {
    const val = parseFloat(editStudentFeeInput);
    if (!isNaN(val) && onUpdateStudentFee) {
      onUpdateStudentFee(studentId, val);
    }
    setEditingStudentId(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Nom élève', 'Identifiant', 'Niveau', 'Séances étudiées', `Montant dû (${currency})`, 'Statut de paiement', 'Dernier paiement'];
    const rows = students.map((s) => {
      const studentLessons = monthLessons.filter((l) => l.studentIds.includes(s.id));
      const attended = studentLessons.filter((l) => l.attendance && l.attendance[s.id] === 'present');
      const fee = s.monthlyFee ?? (s.ratePerHour > 0 ? s.ratePerHour * 2 : 60);
      const isPaid = s.paid ? 'Payé' : 'En attente';

      return [
        `"${s.name}"`,
        `"${s.handle}"`,
        `"${s.grade}"`,
        attended.length,
        fee,
        `"${isPaid}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rapport_etudiants_${monthName}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#18181c] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Rapport des élèves & gestion des montants</h3>
            <p className="text-xs text-neutral-400">
              {monthName} {year} · {monthLessons.length} séances planifiées ce mois-ci
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Detailed Students Table with Inline Edits and 1-Click Paid Toggle */}
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#101013]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-neutral-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Élève</th>
                  <th className="py-3 px-3 text-center">Séances étudiées</th>
                  <th className="py-3 px-4 text-right">Montant ({currency})</th>
                  <th className="py-3 px-4 text-center">Paiement</th>
                  <th className="py-3 px-4 text-center">Dernier paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {students.map((student) => {
                  const studentLessons = monthLessons.filter((l) => l.studentIds.includes(student.id));
                  const attended = studentLessons.filter((l) => l.attendance && l.attendance[student.id] === 'present');
                  
                  const isEditingThisStudent = editingStudentId === student.id;
                  const currentAmount = student.monthlyFee ?? (student.ratePerHour > 0 ? student.ratePerHour * 2 : 60);

                  return (
                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-sans font-medium text-neutral-200">
                        <span className="font-bold text-white mr-1.5">{student.handle}</span>
                        <span className="text-neutral-500 text-[11px] block">{student.name} · {student.grade}</span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-sans">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          attended.length > 0 ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-neutral-500'
                        }`}>
                          {attended.length} séance{attended.length > 1 ? 's' : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-white">
                        {isEditingThisStudent ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editStudentFeeInput}
                              onChange={(e) => setEditStudentFeeInput(e.target.value)}
                              className="w-20 bg-[#1e1e24] border border-blue-500 text-xs font-bold font-mono px-2 py-1 rounded text-right text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveStudentFee(student.id)}
                              className="p-1 bg-emerald-600 rounded text-white hover:bg-emerald-500 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStudentId(null)}
                              className="p-1 bg-neutral-700 rounded text-white hover:bg-neutral-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditStudentFeeInput(String(currentAmount));
                              setEditingStudentId(student.id);
                            }}
                            className="inline-flex items-center gap-1.5 group/fee cursor-pointer hover:text-blue-400 transition-colors"
                            title="Cliquer pour modifier le montant de cet élève"
                          >
                            <span>{currentAmount}</span>
                            <Edit2 className="w-3 h-3 text-neutral-500 opacity-0 group-hover/fee:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onTogglePaid && onTogglePaid(student.id)}
                          className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                            student.paid
                              ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900'
                              : 'text-amber-300 bg-amber-950/80 border border-amber-500/40 hover:bg-amber-900'
                          }`}
                          title="Cliquer pour basculer le statut Payé / En attente"
                        >
                          {student.paid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Payé</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              <span>En attente</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center text-neutral-500 font-mono text-[10px]">
                        {student.lastPaidDate || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#141417]">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter en CSV
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
