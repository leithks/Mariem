import React, { useMemo } from 'react';
import { TutorProfile, LessonSession } from '../../types';
import { Settings, Edit2 } from 'lucide-react';
import { formatDateStr } from '../../utils/calendar';
import { supabase } from '../../lib/supabase';

interface TutorHeaderProps {
  profile: TutorProfile;
  onUpdateProfile: (profile: TutorProfile) => void;
  onOpenSettings: () => void;
  currentDate?: Date;
  lessons?: LessonSession[];
}

export const TutorHeader: React.FC<TutorHeaderProps> = ({
  profile,
  onUpdateProfile,
  onOpenSettings,
  currentDate,
  lessons,
}) => {
  // Compute number of cours for the selected/current day
  const coursCount = useMemo(() => {
    if (!lessons || !currentDate) return 2;
    const dateStr = formatDateStr(currentDate);
    return lessons.filter((l) => l.date === dateStr).length;
  }, [lessons, currentDate]);


  return (
    <div className="space-y-3">
      {/* Profile Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div className="relative w-11 h-11 rounded-full bg-[#1e1e24] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            <svg
              className="w-7 h-7 text-white fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C9.24 2 7 4.24 7 7c0 1.95 1.13 3.64 2.78 4.47C6.54 12.63 4 15.7 4 19.5c0 .28.22.5.5.5h15c.28 0 .5-.22.5-.5 0-3.8-2.54-6.87-5.78-8.03C15.87 10.64 17 8.95 17 7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm-6 14c.48-3.08 2.97-5.5 6-5.5s5.52 2.42 6 5.5H6z" />
            </svg>
          </div>

          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              {profile.name}
            </h1>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="text-neutral-500 hover:text-white transition-colors"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>

      {/* Daily Briefing / Description */}
      <div className="group relative">
      <p className="text-[12.5px] leading-relaxed text-neutral-300 font-normal">
        Hello Habibi! ❤️ You have {coursCount} {coursCount === 1 ? 'lesson' : 'lessons'} scheduled today.
        <br />
        11:11 i love you ktikita
      </p>
      </div>
    </div>
  );
};
