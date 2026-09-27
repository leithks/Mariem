import React from 'react';
import { StudentEarningsSummary } from '../../utils/calendar';
import { Student } from '../../types';

interface EarningsCardProps {
  totalEarnings: number;
  currency: string;
  studentSummaries: StudentEarningsSummary[];
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onOpenEarningsBreakdown?: () => void;
}

export const EarningsCard: React.FC<EarningsCardProps> = ({
  totalEarnings,
  currency,
  studentSummaries,
  students,
  onSelectStudent,
  onOpenEarningsBreakdown,
}) => {
  const getBadgeStyle = (badgeType: 'green' | 'yellow' | 'pink') => {
    switch (badgeType) {
      case 'green':
        return {
          container: 'bg-[#B4F0C8] hover:bg-[#a0ecc3] text-[#0d4f2b] border-[#92e2ac]',
          tag: 'bg-[#92E2AC] text-[#0d4f2b]',
          status: 'text-[#0d4f2b] font-bold font-mono',
        };
      case 'yellow':
        return {
          container: 'bg-[#FEE08B] hover:bg-[#fed775] text-[#5c3c04] border-[#f5cd61]',
          tag: 'bg-[#F6CF63] text-[#5c3c04]',
          status: 'text-[#5c3c04] font-semibold',
        };
      case 'pink':
      default:
        return {
          container: 'bg-[#F9BCD7] hover:bg-[#f6a9cb] text-[#63183d] border-[#f0a1c4]',
          tag: 'bg-[#F19EC2] text-[#63183d]',
          status: 'text-[#63183d] font-medium',
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-2xl space-y-3.5 text-black">
      {/* Header - Visualisation Only */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-neutral-800 tracking-tight">
          Gains
        </span>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold font-mono tracking-tight text-neutral-950 tabular-nums">
            {totalEarnings}
          </span>
          <span className="text-sm font-bold text-neutral-700">
            {currency}
          </span>
        </div>
      </div>

      {/* Badges List - Visualisation Only */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5 custom-scrollbar">
        {studentSummaries.map((summary) => {
          const student = students.find((s) => s.id === summary.studentId);
          const style = getBadgeStyle(summary.badgeType);

          return (
            <div
              key={summary.studentId}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl border transition-all shadow-xs ${style.container}`}
            >
              {/* Student handle tag */}
              <button
                type="button"
                onClick={() => student && onSelectStudent(student)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-90 ${style.tag}`}
                title="Voir la fiche de l'élève"
              >
                {summary.handle}
              </button>

              {/* Status text: Green (+amount) or Yellow (A étudié X fois) or Pink */}
              <span className={`text-xs ${style.status}`}>
                {summary.statusText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action button to open detailed editable report */}
      {onOpenEarningsBreakdown && (
        <button
          type="button"
          onClick={onOpenEarningsBreakdown}
          className="w-full text-center text-xs font-bold text-neutral-700 hover:text-neutral-950 py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <span>Voir le rapport & modifier</span>
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
};
