import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Trash2 } from 'lucide-react';
import { formatMonthYear } from '../../utils/calendar';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenPointage?: () => void;
  todayPointageCount?: { attended: number; total: number };
  onClearCalendar?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onOpenPointage,
  todayPointageCount,
  onClearCalendar,
}) => {
  const formattedTitle = formatMonthYear(currentDate);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 shrink-0">
      {/* Month, Year Title (e.g., Septembre, 2026) */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 capitalize">
          {formattedTitle}
        </h2>
      </div>

      {/* Controls row matching design */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Clear Calendar Button */}
        {onClearCalendar && (
          <button
            type="button"
            onClick={onClearCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 text-xs font-semibold border border-neutral-200 hover:border-rose-200 transition-all cursor-pointer"
            title="Effacer tous les créneaux du calendrier"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Effacer le calendrier</span>
          </button>
        )}

        {/* Pointage Action Circle Button in Corner */}
        {onOpenPointage && (
          <button
            type="button"
            onClick={onOpenPointage}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer group"
            title="Ouvrir le panneau de pointage des présences"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span>Pointage</span>
            {todayPointageCount && todayPointageCount.total > 0 && (
              <span className="bg-emerald-950/40 text-emerald-100 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                {todayPointageCount.attended}/{todayPointageCount.total}
              </span>
            )}
          </button>
        )}

        {/* Month | Week Segmented Toggle */}
        <div className="bg-[#f0f2f5] p-1 rounded-2xl flex items-center shadow-inner">
          <button
            onClick={() => onViewModeChange('month')}
            className={`px-4 sm:px-5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => onViewModeChange('week')}
            className={`px-4 sm:px-5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Semaine
          </button>
        </div>

        {/* Navigation Buttons: < Aujourd'hui > */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            className="w-9 h-9 rounded-xl bg-[#f0f2f5] hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Précédent"
            aria-label="Semaine ou mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onToday}
            className="px-3.5 py-1.5 rounded-xl bg-[#f0f2f5] hover:bg-neutral-200 text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
          >
            Aujourd'hui
          </button>

          <button
            onClick={onNext}
            className="w-9 h-9 rounded-xl bg-[#f0f2f5] hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Suivant"
            aria-label="Semaine ou mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
