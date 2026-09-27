import React, { useState } from 'react';
import { Student, LessonSession, ColorTheme } from '../../types';
import { STUDENT_COLOR_TAGS } from '../../utils/colors';
import { AVAILABLE_GRADES, AVAILABLE_SUBJECTS } from '../../data/initialData';
import { X, User, Phone, BookOpen, Clock, Calendar, Check, Trash2, ChevronDown } from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  lessons: LessonSession[];
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  currency: string;
}

const COLOR_OPTIONS: { id: ColorTheme; label: string }[] = [
  { id: 'blue', label: 'Bleu' },
  { id: 'yellow', label: 'Jaune' },
  { id: 'pink', label: 'Rose' },
  { id: 'green', label: 'Vert' },
  { id: 'purple', label: 'Violet' },
  { id: 'orange', label: 'Orange' },
];

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  lessons,
  onUpdateStudent,
  onDeleteStudent,
  currency,
}) => {
  if (!isOpen || !student) return null;

  const [name, setName] = useState(student.name);
  const [handle, setHandle] = useState(student.handle);
  const [grade, setGrade] = useState(student.grade);
  const [defaultSubject, setDefaultSubject] = useState(student.defaultSubject);
  const [ratePerHour, setRatePerHour] = useState(student.ratePerHour);
  const [paid, setPaid] = useState(student.paid);
  const [color, setColor] = useState<ColorTheme>(student.color);
  const [customStatus, setCustomStatus] = useState(student.customStatus || '');
  const [phone, setPhone] = useState(student.phone || '');
  const [parentPhone, setParentPhone] = useState(student.parentPhone || '');
  const [notes, setNotes] = useState(student.notes || '');

  const studentLessons = lessons.filter((l) => l.studentIds.includes(student.id));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStudent({
      ...student,
      name: name.trim(),
      handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      grade: grade.trim(),
      defaultSubject: defaultSubject.trim(),
      ratePerHour: Number(ratePerHour) || 30,
      paid,
      color,
      customStatus: customStatus.trim() || undefined,
      phone: phone.trim() || undefined,
      parentPhone: parentPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const tagStyle = STUDENT_COLOR_TAGS[color] || STUDENT_COLOR_TAGS.blue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#18181c] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}>
              {handle}
            </span>
            <h3 className="text-lg font-bold tracking-tight">{name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Nom complet
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#101013] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Identifiant @nom
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
                className="w-full bg-[#101013] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
          </div>

          {/* Grade and Subject/Rate */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-neutral-400">Niveau / Classe</label>
                <span className="px-2.5 py-0.5 bg-white/10 text-white text-[10px] font-bold rounded-full border border-white/10 shadow-sm">{grade}</span>
              </div>
              <input
                type="range"
                min="0"
                max={AVAILABLE_GRADES.length - 1}
                value={AVAILABLE_GRADES.indexOf(grade)}
                onChange={(e) => setGrade(AVAILABLE_GRADES[parseInt(e.target.value)])}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white hover:accent-neutral-200 transition-all focus:outline-none focus:ring-1 focus:ring-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Matière
                </label>
                <div className="flex gap-1">
                  {AVAILABLE_SUBJECTS.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setDefaultSubject(s.name)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                        defaultSubject === s.name
                          ? 'bg-white/10 border-white text-white'
                          : 'bg-[#101013] border-white/5 text-neutral-500 hover:border-white/20 hover:text-neutral-300'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Tarif / Heure
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={ratePerHour}
                    onChange={(e) => setRatePerHour(Number(e.target.value))}
                    className="w-full bg-[#101013] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono pr-8"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-neutral-400 font-bold">
                    {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status & Custom status */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#101013] rounded-2xl border border-white/5">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Statut de paiement ce mois
              </label>
              <button
                type="button"
                onClick={() => setPaid(!paid)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  paid
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                    : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                }`}
              >
                {paid ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Payé</span>
                  </>
                ) : (
                  <span>Non payé (En attente)</span>
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Texte personnalisé sur la carte de gains
              </label>
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="Ex: +540DT, A étudié 5 fois..."
                className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Téléphone élève
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 ..."
                className="w-full bg-[#101013] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Téléphone parent
              </label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+216 ..."
                className="w-full bg-[#101013] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Color Tag Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
              Couleur du badge
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => {
                const style = STUDENT_COLOR_TAGS[c.id];
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setColor(c.id)}
                    className={`w-7 h-7 rounded-full ${style.bg} border ${style.border} flex items-center justify-center transition-all cursor-pointer ${
                      color === c.id ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Notes pédagogiques & Suivi
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Points à réviser, devoirs, progrès..."
              className="w-full bg-[#101013] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 resize-none"
            />
          </div>

          {/* Past Sessions List */}
          <div className="pt-2 border-t border-white/5">
            <h4 className="text-xs font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Séances effectuées ({studentLessons.length})
            </h4>
            {studentLessons.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">Aucune séance pour le moment.</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {studentLessons.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between text-xs bg-[#101013] px-3 py-1.5 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-neutral-400">{l.date}</span>
                      <span className="font-semibold text-white">{l.title}</span>
                      <span className="text-neutral-500 font-mono text-[11px]">
                        ({l.startTime} - {l.endTime})
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">
                      +{l.ratePerStudent ?? student.ratePerHour * 2} {currency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#141417]">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Voulez-vous vraiment supprimer ${student.name} (${student.handle}) ?`)) {
                onDeleteStudent(student.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer l'élève</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
