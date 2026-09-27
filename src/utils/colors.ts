import { ColorTheme, LessonSession } from '../types';

export const FOUR_CONTAINER_COLORS: ColorTheme[] = ['blue', 'green', 'yellow', 'pink'];
export const CONTAINER_COLOR_CYCLE = FOUR_CONTAINER_COLORS;

// Helper to determine the next alternating block color in sequence:
// 1st block: Blue, 2nd: Green, 3rd: Yellow, 4th: Pink, 5th: Blue...
export function getNextBlockColor(lessons: LessonSession[]): ColorTheme {
  const sequence: ColorTheme[] = ['blue', 'green', 'yellow', 'pink'];
  if (!lessons || lessons.length === 0) return sequence[0];

  // Group by unique block/series
  const seenSeries = new Set<string>();
  let distinctBlockCount = 0;

  for (const l of lessons) {
    const key = l.seriesId || `${l.date}_${l.startTime}`;
    if (!seenSeries.has(key)) {
      seenSeries.add(key);
      distinctBlockCount += 1;
    }
  }

  return sequence[distinctBlockCount % sequence.length];
}

export const CARD_THEMES: Record<
  ColorTheme,
  {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    avatarBorder: string;
  }
> = {
  blue: {
    bg: 'bg-[#BCE0FD]',
    text: 'text-[#0f3460]',
    border: 'border-[#9bcbf8]',
    badgeBg: 'bg-[#98CBF7]',
    badgeText: 'text-[#0f3460]',
    avatarBorder: 'border-[#ffffff]',
  },
  green: {
    bg: 'bg-[#A8ECC3]',
    text: 'text-[#0e4828]',
    border: 'border-[#8ee0ad]',
    badgeBg: 'bg-[#8EE0AD]',
    badgeText: 'text-[#0e4828]',
    avatarBorder: 'border-[#ffffff]',
  },
  yellow: {
    bg: 'bg-[#FED88A]',
    text: 'text-[#573a08]',
    border: 'border-[#f5c76b]',
    badgeBg: 'bg-[#F6C769]',
    badgeText: 'text-[#573a08]',
    avatarBorder: 'border-[#ffffff]',
  },
  pink: {
    bg: 'bg-[#F5A3CE]',
    text: 'text-[#5c1d3c]',
    border: 'border-[#f49bc9]',
    badgeBg: 'bg-[#EE8DBF]',
    badgeText: 'text-[#5c1d3c]',
    avatarBorder: 'border-[#ffffff]',
  },
  purple: {
    bg: 'bg-[#D9CEFD]',
    text: 'text-[#381e72]',
    border: 'border-[#c4b5fd]',
    badgeBg: 'bg-[#C5B5FB]',
    badgeText: 'text-[#381e72]',
    avatarBorder: 'border-[#ffffff]',
  },
  orange: {
    bg: 'bg-[#FED7AA]',
    text: 'text-[#63290b]',
    border: 'border-[#fdb072]',
    badgeBg: 'bg-[#FDBA74]',
    badgeText: 'text-[#63290b]',
    avatarBorder: 'border-[#ffffff]',
  },
};

export const STUDENT_COLOR_TAGS: Record<
  ColorTheme,
  {
    bg: string;
    text: string;
    dot: string;
    border: string;
  }
> = {
  blue: {
    bg: 'bg-[#1e293b]',
    text: 'text-[#7dd3fc]',
    dot: 'bg-[#38bdf8]',
    border: 'border-[#38bdf8]/30',
  },
  green: {
    bg: 'bg-[#13281d]',
    text: 'text-[#86efac]',
    dot: 'bg-[#22c55e]',
    border: 'border-[#4ade80]/30',
  },
  yellow: {
    bg: 'bg-[#292211]',
    text: 'text-[#fde047]',
    dot: 'bg-[#eab308]',
    border: 'border-[#facc15]/30',
  },
  pink: {
    bg: 'bg-[#2d1424]',
    text: 'text-[#f9a8d4]',
    dot: 'bg-[#ec4899]',
    border: 'border-[#f472b6]/30',
  },
  purple: {
    bg: 'bg-[#211933]',
    text: 'text-[#d8b4fe]',
    dot: 'bg-[#a855f7]',
    border: 'border-[#c084fc]/30',
  },
  orange: {
    bg: 'bg-[#2d1b11]',
    text: 'text-[#fdba74]',
    dot: 'bg-[#f97316]',
    border: 'border-[#fb923c]/30',
  },
};
