import React, { useState } from 'react';
import { TutorProfile } from '../../types';
import { X, RefreshCw, DollarSign, User } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TutorProfile;
  onSaveProfile: (profile: TutorProfile) => void;
  onResetDemoData: () => void;
  onLoadDemoLessons: () => void;
}

const CURRENCIES = ['DT', 'TND', '$', '€', '£', 'MAD', 'DZD'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetDemoData,
  onLoadDemoLessons,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline);
  const [currency, setCurrency] = useState(profile.currency);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(profile.defaultHourlyRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim(),
      tagline: tagline.trim(),
      currency,
      defaultHourlyRate: Number(defaultHourlyRate) || 30,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#18181c] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold tracking-tight">Paramètres de l'enseignant</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Nom de l'enseignant
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#101013] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Description de l'application / Slogan
            </label>
            <textarea
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              rows={2}
              className="w-full bg-[#101013] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Devise
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#101013] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} className="bg-[#18181c]">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Tarif horaire par défaut
              </label>
              <input
                type="number"
                value={defaultHourlyRate}
                onChange={(e) => setDefaultHourlyRate(Number(e.target.value))}
                className="w-full bg-[#101013] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <button
              type="button"
              onClick={() => {
                onLoadDemoLessons();
                onClose();
              }}
              className="w-full flex items-center justify-between text-xs text-blue-400 hover:text-blue-300 py-1.5 px-2 rounded-lg hover:bg-blue-950/30 transition-colors cursor-pointer"
            >
              <span>Charger les exemples de séances de la capture d'écran</span>
              <span className="font-bold">→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Réinitialiser toutes les données ?')) {
                  onResetDemoData();
                  onClose();
                }
              }}
              className="w-full flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 py-1.5 px-2 rounded-lg hover:bg-amber-950/30 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réinitialiser calendrier vide & élèves initiaux
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
