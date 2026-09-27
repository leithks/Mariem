import React, { useState } from 'react';
import { Student, ColorTheme } from '../../types';
import { AVAILABLE_SUBJECTS, AVAILABLE_GRADES } from '../../data/initialData';
import { Plus, ChevronDown } from 'lucide-react';

interface AddStudentFormProps {
  onAddStudent: (student: Omit<Student, 'id' | 'joinedDate'>) => void;
  currency: string;
}

export const AddStudentForm: React.FC<AddStudentFormProps> = ({
  onAddStudent,
}) => {
  const [handle, setHandle] = useState('');
  const [grade, setGrade] = useState('Bac');
  const [subject, setSubject] = useState('Info');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setErrorMessage('Veuillez saisir un nom ou @identifiant');
      return;
    }

    let formattedHandle = handle.trim();
    if (!formattedHandle.startsWith('@')) {
      formattedHandle = `@${formattedHandle.toLowerCase().replace(/\s+/g, '')}`;
    }

    const cleanName = handle.replace(/^@/, '').trim();
    const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    // Pick matching color theme for the selected subject
    const matchedSubject = AVAILABLE_SUBJECTS.find(
      (s) => s.name.toLowerCase() === subject.trim().toLowerCase()
    );
    const chosenColor: ColorTheme = matchedSubject ? matchedSubject.color : 'blue';

    onAddStudent({
      handle: formattedHandle,
      name: formattedName || 'Élève',
      grade: grade || 'Bac',
      defaultSubject: subject || 'Info',
      ratePerHour: 30,
      paid: false,
      color: chosenColor,
      customStatus: "N'a pas assisté ce mois-ci",
    });

    // Reset fields
    setHandle('');
    setGrade('Bac');
    setSubject('Info');
    setErrorMessage('');
  };

  return (
    <div className="bg-[#151518] border border-white/[0.07] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">Ajouter</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {/* @nom input */}
          <div className="relative">
            <input
              type="text"
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="@nom"
              className="w-full bg-[#0e0e11] border border-white/[0.08] text-white text-xs rounded-xl px-2.5 py-2.5 placeholder-neutral-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all text-center"
            />
          </div>

          {/* Grade Selector: Text + Slider */}
          {/* Grade Selector: Text + Slider */}
          <div className="col-span-2 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-400 font-medium">Niveau:</span>
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

          {/* Matière Buttons (3 items) */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-400 font-medium">Matière:</label>
            <div className="flex gap-1">
              {AVAILABLE_SUBJECTS.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setSubject(s.name)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                    subject === s.name
                      ? 'bg-white/10 border-white text-white'
                      : 'bg-[#0e0e11] border-white/5 text-neutral-500 hover:border-white/20 hover:text-neutral-300'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-400 font-medium px-1 animate-fadeIn">
            {errorMessage}
          </p>
        )}

        {/* Big White Pill Button "Ajouter élève" */}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-white hover:bg-neutral-100 text-neutral-900 rounded-full font-bold text-sm tracking-tight transition-all duration-150 active:scale-[0.99] shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-neutral-900" />
          <span>Ajouter élève</span>
        </button>
      </form>
    </div>
  );
};
