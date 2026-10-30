import { CalendarEvent, EventCategory, EventSortOption, SortDirection, StayLocation } from '../types/calendar';

export interface UserColorTheme {
  name: string;
  avatarBg: string;
  sliderTrack: string;
  activeText: string;
  activeBg: string;
  border: string;
  badgeBg: string;
  hoverText: string;
  dotColor: string;
}

export function getUserColorTheme(colorClass?: string, fallback: 'purple' | 'blue' = 'purple'): UserColorTheme {
  const c = (colorClass || '').toLowerCase();
  
  if (c.includes('blue') && !c.includes('sky')) {
    return {
      name: 'Blue',
      avatarBg: 'bg-blue-600',
      sliderTrack: 'bg-blue-600 dark:bg-blue-500',
      activeText: 'text-blue-700 dark:text-blue-400 font-bold',
      activeBg: 'bg-blue-100 dark:bg-blue-950/60',
      border: 'border-blue-300 dark:border-blue-800',
      badgeBg: 'bg-blue-100/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50',
      hoverText: 'hover:text-blue-700 dark:hover:text-blue-300',
      dotColor: 'bg-blue-600',
    };
  }

  if (c.includes('indigo')) {
    return {
      name: 'Indigo',
      avatarBg: 'bg-indigo-600',
      sliderTrack: 'bg-indigo-600 dark:bg-indigo-500',
      activeText: 'text-indigo-700 dark:text-indigo-400 font-bold',
      activeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
      border: 'border-indigo-300 dark:border-indigo-800',
      badgeBg: 'bg-indigo-100/70 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50',
      hoverText: 'hover:text-indigo-700 dark:hover:text-indigo-300',
      dotColor: 'bg-indigo-600',
    };
  }

  if (c.includes('sky')) {
    return {
      name: 'Sky Blue',
      avatarBg: 'bg-sky-600',
      sliderTrack: 'bg-sky-600 dark:bg-sky-500',
      activeText: 'text-sky-700 dark:text-sky-400 font-bold',
      activeBg: 'bg-sky-100 dark:bg-sky-950/60',
      border: 'border-sky-300 dark:border-sky-800',
      badgeBg: 'bg-sky-100/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50',
      hoverText: 'hover:text-sky-700 dark:hover:text-sky-300',
      dotColor: 'bg-sky-600',
    };
  }

  if (c.includes('teal')) {
    return {
      name: 'Teal',
      avatarBg: 'bg-teal-600',
      sliderTrack: 'bg-teal-600 dark:bg-teal-500',
      activeText: 'text-teal-700 dark:text-teal-400 font-bold',
      activeBg: 'bg-teal-100 dark:bg-teal-950/60',
      border: 'border-teal-300 dark:border-teal-800',
      badgeBg: 'bg-teal-100/70 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50',
      hoverText: 'hover:text-teal-700 dark:hover:text-teal-300',
      dotColor: 'bg-teal-600',
    };
  }

  if (c.includes('emerald') || c.includes('green')) {
    return {
      name: 'Emerald',
      avatarBg: 'bg-emerald-600',
      sliderTrack: 'bg-emerald-600 dark:bg-emerald-500',
      activeText: 'text-emerald-700 dark:text-emerald-400 font-bold',
      activeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
      border: 'border-emerald-300 dark:border-emerald-800',
      badgeBg: 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50',
      hoverText: 'hover:text-emerald-700 dark:hover:text-emerald-300',
      dotColor: 'bg-emerald-600',
    };
  }

  if (c.includes('amber') || c.includes('yellow') || c.includes('orange')) {
    return {
      name: 'Amber',
      avatarBg: 'bg-amber-600',
      sliderTrack: 'bg-amber-600 dark:bg-amber-500',
      activeText: 'text-amber-700 dark:text-amber-400 font-bold',
      activeBg: 'bg-amber-100 dark:bg-amber-950/60',
      border: 'border-amber-300 dark:border-amber-800',
      badgeBg: 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50',
      hoverText: 'hover:text-amber-700 dark:hover:text-amber-300',
      dotColor: 'bg-amber-600',
    };
  }

  if (c.includes('rose') || c.includes('pink')) {
    return {
      name: 'Rose',
      avatarBg: 'bg-rose-600',
      sliderTrack: 'bg-rose-600 dark:bg-rose-500',
      activeText: 'text-rose-700 dark:text-rose-400 font-bold',
      activeBg: 'bg-rose-100 dark:bg-rose-950/60',
      border: 'border-rose-300 dark:border-rose-800',
      badgeBg: 'bg-rose-100/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50',
      hoverText: 'hover:text-rose-700 dark:hover:text-rose-300',
      dotColor: 'bg-rose-600',
    };
  }

  if (c.includes('red') || c.includes('crimson')) {
    return {
      name: 'Crimson',
      avatarBg: 'bg-red-600',
      sliderTrack: 'bg-red-600 dark:bg-red-500',
      activeText: 'text-red-700 dark:text-red-400 font-bold',
      activeBg: 'bg-red-100 dark:bg-red-950/60',
      border: 'border-red-300 dark:border-red-800',
      badgeBg: 'bg-red-100/70 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50',
      hoverText: 'hover:text-red-700 dark:hover:text-red-300',
      dotColor: 'bg-red-600',
    };
  }

  if (c.includes('fuchsia') || c.includes('violet')) {
    return {
      name: 'Fuchsia',
      avatarBg: 'bg-fuchsia-600',
      sliderTrack: 'bg-fuchsia-600 dark:bg-fuchsia-500',
      activeText: 'text-fuchsia-700 dark:text-fuchsia-400 font-bold',
      activeBg: 'bg-fuchsia-100 dark:bg-fuchsia-950/60',
      border: 'border-fuchsia-300 dark:border-fuchsia-800',
      badgeBg: 'bg-fuchsia-100/70 dark:bg-fuchsia-950/40 text-fuchsia-800 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-900/50',
      hoverText: 'hover:text-fuchsia-700 dark:hover:text-fuchsia-300',
      dotColor: 'bg-fuchsia-600',
    };
  }

  if (c.includes('stone') || c.includes('zinc') || c.includes('gray') || c.includes('slate') || c.includes('black')) {
    return {
      name: 'Midnight',
      avatarBg: 'bg-stone-900',
      sliderTrack: 'bg-stone-800 dark:bg-stone-700',
      activeText: 'text-stone-900 dark:text-stone-100 font-bold',
      activeBg: 'bg-stone-200 dark:bg-stone-800',
      border: 'border-stone-400 dark:border-stone-600',
      badgeBg: 'bg-stone-200/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700',
      hoverText: 'hover:text-stone-900 dark:hover:text-stone-100',
      dotColor: 'bg-stone-900',
    };
  }

  if (c.includes('purple')) {
    return {
      name: 'Purple',
      avatarBg: 'bg-purple-600',
      sliderTrack: 'bg-purple-600 dark:bg-purple-500',
      activeText: 'text-purple-700 dark:text-purple-400 font-bold',
      activeBg: 'bg-purple-100 dark:bg-purple-950/60',
      border: 'border-purple-300 dark:border-purple-800',
      badgeBg: 'bg-purple-100/70 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50',
      hoverText: 'hover:text-purple-700 dark:hover:text-purple-300',
      dotColor: 'bg-purple-600',
    };
  }

  // Fallback
  return fallback === 'blue'
    ? {
        name: 'Blue',
        avatarBg: 'bg-blue-600',
        sliderTrack: 'bg-blue-600 dark:bg-blue-500',
        activeText: 'text-blue-700 dark:text-blue-400 font-bold',
        activeBg: 'bg-blue-100 dark:bg-blue-950/60',
        border: 'border-blue-300 dark:border-blue-800',
        badgeBg: 'bg-blue-100/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50',
        hoverText: 'hover:text-blue-700 dark:hover:text-blue-300',
        dotColor: 'bg-blue-600',
      }
    : {
        name: 'Purple',
        avatarBg: 'bg-purple-600',
        sliderTrack: 'bg-purple-600 dark:bg-purple-500',
        activeText: 'text-purple-700 dark:text-purple-400 font-bold',
        activeBg: 'bg-purple-100 dark:bg-purple-950/60',
        border: 'border-purple-300 dark:border-purple-800',
        badgeBg: 'bg-purple-100/70 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50',
        hoverText: 'hover:text-purple-700 dark:hover:text-purple-300',
        dotColor: 'bg-purple-600',
      };
}

export interface CategoryMeta {
  label: string;      // Full name: e.g. "Market Pop-Up"
  shortLabel: string; // Shortened version: e.g. "Markets"
  badgeBg: string;    // Subtle background
  headerBg: string;   // Background when button is active in header
  headerText: string;
  textColor: string;
  dotColor: string;
  borderColor: string;
  iconName: string;
  emoji: string;
  description: string;
}

// 6 completely unique, harmonious, non-clashing colors:
// 1. Markets: Warm Amber
// 2. Dates: Coral Rose
// 3. Repairs: Forest Emerald
// 4. Packing: Sky Blue
// 5. Groceries: Lavender Purple
// 6. Other: Warm Slate / Stone
export const CATEGORY_CONFIG: Record<EventCategory, CategoryMeta> = {
  market: {
    label: 'Market Pop-Up',
    shortLabel: 'Markets',
    badgeBg: 'bg-amber-100/70 dark:bg-yellow-950/35',
    headerBg: 'bg-amber-500 text-stone-950 font-bold dark:bg-yellow-400 dark:text-stone-950',
    headerText: 'text-amber-900 dark:text-yellow-300',
    textColor: 'text-amber-950 dark:text-yellow-200',
    dotColor: 'bg-amber-500 dark:bg-yellow-400',
    borderColor: 'border-amber-300 dark:border-yellow-500/60',
    iconName: 'Store',
    emoji: '🎪',
    description: 'Selling items, booth setup, packing & inventory'
  },
  dinner_date: {
    label: 'Dinner & Dates',
    shortLabel: 'Dates',
    badgeBg: 'bg-rose-100/70 dark:bg-rose-950/45',
    headerBg: 'bg-rose-600 text-white dark:bg-rose-600',
    headerText: 'text-rose-900 dark:text-rose-300',
    textColor: 'text-rose-950 dark:text-rose-200',
    dotColor: 'bg-rose-600 dark:bg-rose-400',
    borderColor: 'border-rose-300 dark:border-rose-500/70',
    iconName: 'UtensilsCrossed',
    emoji: '🍽️',
    description: 'Dinner reservations, evening dates & special outings'
  },
  maintenance: {
    label: 'Housework & Repairs',
    shortLabel: 'Repairs',
    badgeBg: 'bg-emerald-100/70 dark:bg-emerald-950/30',
    headerBg: 'bg-emerald-600 text-white dark:bg-emerald-600',
    headerText: 'text-emerald-900 dark:text-emerald-200',
    textColor: 'text-emerald-950 dark:text-emerald-100',
    dotColor: 'bg-emerald-600',
    borderColor: 'border-emerald-300 dark:border-emerald-800/60',
    iconName: 'Wrench',
    emoji: '🔨',
    description: 'Housework, toolkits, repairs & home projects'
  },
  pets: {
    label: 'Pets & Pet Care',
    shortLabel: 'Pets',
    badgeBg: 'bg-sky-100/80 dark:bg-sky-950/40',
    headerBg: 'bg-sky-500 text-white dark:bg-sky-600',
    headerText: 'text-sky-900 dark:text-sky-200',
    textColor: 'text-sky-950 dark:text-sky-100',
    dotColor: 'bg-sky-500 dark:bg-sky-400',
    borderColor: 'border-sky-300 dark:border-sky-700/60',
    iconName: 'PawPrint',
    emoji: '🐾',
    description: 'Vet checkups, walks, pet feeding, grooming & sitting'
  },
  packing: {
    label: 'Pets & Pet Care',
    shortLabel: 'Pets',
    badgeBg: 'bg-sky-100/80 dark:bg-sky-950/40',
    headerBg: 'bg-sky-500 text-white dark:bg-sky-600',
    headerText: 'text-sky-900 dark:text-sky-200',
    textColor: 'text-sky-950 dark:text-sky-100',
    dotColor: 'bg-sky-500 dark:bg-sky-400',
    borderColor: 'border-sky-300 dark:border-sky-700/60',
    iconName: 'PawPrint',
    emoji: '🐾',
    description: 'Vet checkups, walks, pet feeding, grooming & sitting'
  },
  grocery_errand: {
    label: 'Grocery & Errands',
    shortLabel: 'Groceries',
    badgeBg: 'bg-purple-100/70 dark:bg-purple-950/30',
    headerBg: 'bg-purple-600 text-white dark:bg-purple-600',
    headerText: 'text-purple-900 dark:text-purple-200',
    textColor: 'text-purple-950 dark:text-purple-100',
    dotColor: 'bg-purple-600',
    borderColor: 'border-purple-300 dark:border-purple-800/60',
    iconName: 'ShoppingCart',
    emoji: '🛒',
    description: 'Shared grocery runs and supply restocking'
  },
  other: {
    label: 'Other Shared Plans',
    shortLabel: 'Other',
    badgeBg: 'bg-stone-200/70 dark:bg-stone-800/50',
    headerBg: 'bg-stone-700 text-white dark:bg-stone-600',
    headerText: 'text-stone-800 dark:text-stone-200',
    textColor: 'text-stone-900 dark:text-stone-100',
    dotColor: 'bg-stone-600',
    borderColor: 'border-stone-300 dark:border-stone-700',
    iconName: 'Calendar',
    emoji: '📅',
    description: 'General shared plans'
  }
};

export const STAY_CONFIG: Record<StayLocation, { label: string; short: string; color: string; icon: string }> = {
  her_home: {
    label: "Hers",
    short: "Hers",
    color: "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    icon: "Home"
  },
  his_home: {
    label: "His",
    short: "His",
    color: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    icon: "Home"
  },
  our_home: {
    label: "Home",
    short: "Home",
    color: "text-white bg-black border-stone-900 dark:bg-stone-900 dark:text-white dark:border-stone-700",
    icon: "Home"
  },
  travel: {
    label: "Away",
    short: "Away",
    color: "text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    icon: "Compass"
  }
};

export function getMonthMatrix(year: number, monthIndex: number) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

  // Monday start
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();

  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();

  const calendarDays: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    date: Date;
  }> = [];

  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevMonthDate = new Date(year, monthIndex - 1, dayNum);
    const dateStr = formatDateToYMD(prevMonthDate);
    calendarDays.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
      isToday: isDateToday(prevMonthDate),
      date: prevMonthDate
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    const currDate = new Date(year, monthIndex, day);
    const dateStr = formatDateToYMD(currDate);
    calendarDays.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: true,
      isToday: isDateToday(currDate),
      date: currDate
    });
  }

  const remainingSlots = 7 - (calendarDays.length % 7);
  if (remainingSlots < 7) {
    for (let day = 1; day <= remainingSlots; day++) {
      const nextDate = new Date(year, monthIndex + 1, day);
      const dateStr = formatDateToYMD(nextDate);
      calendarDays.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: isDateToday(nextDate),
        date: nextDate
      });
    }
  }

  return calendarDays;
}

export function formatDateToYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayISO(): string {
  return formatDateToYMD(new Date());
}

export function isDateToday(d: Date): boolean {
  return formatDateToYMD(d) === formatDateToYMD(new Date());
}

export function formatReadableDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return 'Unscheduled Date';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Compare events within the same day:
 * Items WITH a time show first (chronologically).
 * Items WITHOUT a time show AFTER anything with a time.
 */
export function compareEventsInDay(a: { startTime?: string; title: string }, b: { startTime?: string; title: string }): number {
  const hasTimeA = Boolean(a.startTime && a.startTime.trim().length > 0);
  const hasTimeB = Boolean(b.startTime && b.startTime.trim().length > 0);
  if (hasTimeA && !hasTimeB) return -1;
  if (!hasTimeA && hasTimeB) return 1;
  if (hasTimeA && hasTimeB) {
    const timeDiff = a.startTime!.localeCompare(b.startTime!);
    if (timeDiff !== 0) return timeDiff;
  }
  return a.title.localeCompare(b.title);
}

/**
 * Compare events across days / multi-view:
 * 1. Items WITH a date show first; items without a date show AFTER.
 * 2. If dates match, items WITH a time show first; items without a time show AFTER.
 */
export function compareEvents(a: { startDate?: string; startTime?: string; title: string }, b: { startDate?: string; startTime?: string; title: string }): number {
  const hasDateA = Boolean(a.startDate && a.startDate.trim().length > 0);
  const hasDateB = Boolean(b.startDate && b.startDate.trim().length > 0);
  if (hasDateA && !hasDateB) return -1;
  if (!hasDateA && hasDateB) return 1;
  if (hasDateA && hasDateB && a.startDate !== b.startDate) {
    return a.startDate!.localeCompare(b.startDate!);
  }
  return compareEventsInDay(a, b);
}

/**
 * Sort events within a single day according to chosen Sort Option & Direction:
 * - When sortDirection is 'none', preserves natural entry order.
 * - In 'asc' / 'desc', applies sortOption order.
 */
export function sortEventsForDay(
  events: CalendarEvent[],
  sortOption: EventSortOption = 'time',
  sortDirection: SortDirection = 'none'
): CalendarEvent[] {
  if (sortDirection === 'none') {
    return [...events];
  }

  const sorted = [...events].sort((a, b) => {
    let diff = 0;
    if (sortOption === 'category') {
      const catOrder: Record<EventCategory, number> = {
        market: 1,
        dinner_date: 2,
        maintenance: 3,
        pets: 4,
        packing: 4,
        grocery_errand: 5,
        other: 6
      };
      diff = (catOrder[a.category] || 99) - (catOrder[b.category] || 99);
      if (diff === 0) diff = compareEventsInDay(a, b);
    } else if (sortOption === 'partner') {
      const partOrder = { both: 1, her: 2, him: 3 };
      diff = (partOrder[a.assignedTo] || 99) - (partOrder[b.assignedTo] || 99);
      if (diff === 0) diff = compareEventsInDay(a, b);
    } else if (sortOption === 'tasks') {
      const aTasks = a.tasks?.length || 0;
      const bTasks = b.tasks?.length || 0;
      diff = bTasks - aTasks;
      if (diff === 0) diff = compareEventsInDay(a, b);
    } else {
      // Default 'time'
      const hasTimeA = Boolean(a.startTime && a.startTime.trim().length > 0);
      const hasTimeB = Boolean(b.startTime && b.startTime.trim().length > 0);
      if (hasTimeA && !hasTimeB) return -1;
      if (!hasTimeA && hasTimeB) return 1;
      if (hasTimeA && hasTimeB) {
        diff = a.startTime!.localeCompare(b.startTime!);
      }
      if (diff === 0) diff = a.title.localeCompare(b.title);
    }

    return sortDirection === 'desc' ? -diff : diff;
  });

  return sorted;
}

/**
 * Sort events across calendar views / multi-day according to chosen Sort Option:
 * - Items with date/time show first; items without date/time show AFTER.
 */
export function sortCalendarEvents(
  events: CalendarEvent[],
  sortOption: EventSortOption = 'time',
  sortDirection: SortDirection = 'none'
): CalendarEvent[] {
  return [...events].sort((a, b) => {
    // 1. Primary date sorting
    const hasDateA = Boolean(a.startDate && a.startDate.trim().length > 0);
    const hasDateB = Boolean(b.startDate && b.startDate.trim().length > 0);
    if (hasDateA && !hasDateB) return -1;
    if (!hasDateA && hasDateB) return 1;
    if (hasDateA && hasDateB && a.startDate !== b.startDate) {
      return a.startDate!.localeCompare(b.startDate!);
    }

    // 2. When on the same date, apply chosen day sort option & direction
    return sortEventsForDay([a, b], sortOption, sortDirection)[0] === a ? -1 : 1;
  });
}

/**
 * Format 24-hour time string (e.g. "17:30" or "08:00") into US time format (00:00 AM/PM):
 * e.g. "17:30" -> "05:30 PM", "08:00" -> "08:00 AM", "12:00" -> "12:00 PM", "00:00" -> "12:00 AM"
 */
export function formatUsTime(timeStr?: string): string {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  // If already contains AM or PM, return as is
  if (/AM|PM/i.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;

  const hoursNum = parseInt(parts[0], 10);
  const minutesNum = parseInt(parts[1], 10);
  if (isNaN(hoursNum) || isNaN(minutesNum)) return trimmed;

  const period = hoursNum >= 12 ? 'PM' : 'AM';
  let hour12 = hoursNum % 12;
  if (hour12 === 0) hour12 = 12;

  const paddedHour = String(hour12).padStart(2, '0');
  const paddedMin = String(minutesNum).padStart(2, '0');

  return `${paddedHour}:${paddedMin} ${period}`;
}

/**
 * Format a start and optional end time into a US time range:
 * e.g. "08:00", "16:00" -> "08:00 AM – 04:00 PM"
 * e.g. "18:30" -> "06:30 PM"
 */
export function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime && !endTime) return '';
  if (startTime && !endTime) return formatUsTime(startTime);
  if (!startTime && endTime) return formatUsTime(endTime);
  return `${formatUsTime(startTime)} – ${formatUsTime(endTime)}`;
}

/**
 * Centralized partner filter matcher:
 * Returns true if the event's assignment matches the partnerFilter perspective.
 */
export function matchesPartnerFilter(assignedTo?: string, partnerFilter: string = 'all'): boolean {
  if (partnerFilter === 'all') return true;
  if (!assignedTo || assignedTo === 'both') return true;
  if ((partnerFilter === 'him' || partnerFilter === 'his') && (assignedTo === 'him' || assignedTo === 'his')) return true;
  if (partnerFilter === 'her' && (assignedTo === 'her' || assignedTo === 'hers')) return true;
  return false;
}

/**
 * Checks whether an event occurs on a specific date (supports multi-day event spans).
 */
export function eventOccursOnDate(event: { startDate: string; endDate?: string }, dateStr: string): boolean {
  if (!event || !event.startDate) return false;
  return event.startDate <= dateStr && (event.endDate || event.startDate) >= dateStr;
}

