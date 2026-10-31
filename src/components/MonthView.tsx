import React from 'react';
import { CalendarEvent, DayStayInfo, EventCategory, EventSortOption, SortDirection } from '../types/calendar';
import { getMonthMatrix, sortEventsForDay, matchesPartnerFilter, eventOccursOnDate } from '../utils/calendarUtils';
import { useAuth } from '../context/AuthContext';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  stays: Record<string, DayStayInfo>;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onToggleTask?: (eventId: string, taskId: string, completed: boolean) => void;
  categoryFilter: EventCategory | 'all';
  partnerFilter: 'all' | 'her' | 'him';
  sortOption?: EventSortOption;
  sortDirection?: SortDirection;
  expandedEventIds?: Record<string, boolean>;
  expandedTaskSections?: Record<string, boolean>;
  onToggleExpandEvent?: (eventId: string) => void;
  onToggleExpandTasks?: (eventId: string) => void;
}

const WEEKDAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
];

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  stays,
  selectedDate,
  onSelectDate,
  categoryFilter,
  partnerFilter,
  sortOption = 'time',
  sortDirection = 'none',
}) => {
  const { partner1Label, partner2Label, partner1Initial, partner2Initial, user1Theme, user2Theme } = useAuth();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarCells = getMonthMatrix(year, month);

  // Filter events based on active category & partner perspective
  const filteredEvents = events.filter((evt) => {
    if (categoryFilter !== 'all' && evt.category !== categoryFilter) return false;
    return matchesPartnerFilter(evt.assignedTo, partnerFilter);
  });

  // Group events by dateStr (supporting multi-day spans)
  const eventsByDate = filteredEvents.reduce<Record<string, CalendarEvent[]>>((acc, evt) => {
    calendarCells.forEach((cell) => {
      if (eventOccursOnDate(evt, cell.dateStr)) {
        if (!acc[cell.dateStr]) acc[cell.dateStr] = [];
        acc[cell.dateStr].push(evt);
      }
    });
    return acc;
  }, {});

  return (
    <div className="bg-[#fbf9f5] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] overflow-hidden shadow-2xs transition-colors">
      {/* Weekday Column Headers starting on Monday */}
      <div className="grid grid-cols-7 border-b border-[#e4ded5] dark:border-[#2d3139] bg-[#f5f2eb] dark:bg-[#1f2228] text-xs font-medium text-stone-500 dark:text-stone-400">
        {WEEKDAYS.map((day) => (
          <div
            key={day.short}
            className="py-2 px-2 sm:px-3 text-center sm:text-left flex items-center justify-between"
          >
            <span>{day.short}</span>
          </div>
        ))}
      </div>

      {/* 7-column Calendar Day Matrix */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[#e4ded5] dark:divide-[#2d3139]">
        {calendarCells.map((cell) => {
          const isSelected = selectedDate === cell.dateStr;
          const rawEvents = eventsByDate[cell.dateStr] || [];
          const dayEvents = sortDirection === 'none'
            ? [...rawEvents].sort((a, b) => {
                const timeA = a.startTime?.trim() || '';
                const timeB = b.startTime?.trim() || '';
                if (!timeA && timeB) return -1;
                if (timeA && !timeB) return 1;
                if (timeA && timeB) {
                  const diff = timeA.localeCompare(timeB);
                  if (diff !== 0) return diff;
                }
                return a.title.localeCompare(b.title);
              })
            : sortEventsForDay(rawEvents, sortOption, sortDirection);
          const stayInfo = stays[cell.dateStr];

          let dayNumColorClass = '';
          if (stayInfo && cell.isCurrentMonth) {
            if (stayInfo.stayAt === 'her_home') {
              dayNumColorClass = user1Theme.badgeBg;
            } else if (stayInfo.stayAt === 'his_home') {
              dayNumColorClass = user2Theme.badgeBg;
            } else if (stayInfo.stayAt === 'our_home') {
              dayNumColorClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-300 dark:border-purple-700';
            } else {
              dayNumColorClass = 'bg-stone-200/80 text-stone-800 dark:bg-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-600';
            }

            if (cell.isToday) {
              dayNumColorClass += ' ring-2 ring-stone-900 dark:ring-white ring-offset-1 font-extrabold shadow-2xs';
            }
          } else {
            if (cell.isToday) {
              dayNumColorClass = 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs font-bold';
            } else if (cell.isCurrentMonth) {
              dayNumColorClass = 'text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white';
            } else {
              dayNumColorClass = 'text-stone-400 dark:text-stone-600';
            }
          }

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[60px] sm:min-h-[84px] md:min-h-[100px] p-1.5 sm:p-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                !cell.isCurrentMonth
                  ? 'bg-[#f3f0e8]/40 dark:bg-[#16181c]/50 text-stone-400 dark:text-stone-600'
                  : 'bg-[#fcfaf6] dark:bg-[#1d2026] hover:bg-[#f6f2ea] dark:hover:bg-[#23272e] text-stone-800 dark:text-stone-200'
              } ${isSelected ? 'ring-2 ring-stone-900 dark:ring-stone-100 ring-inset z-10 bg-[#f5f0e6] dark:bg-[#262a32]' : ''}`}
            >
              {/* Top Row: Day number directly colored with Stay partner's theme */}
              <div className="flex items-center justify-between">
                <span
                  title={stayInfo && cell.isCurrentMonth ? `Stay: ${stayInfo.stayAt === 'her_home' ? partner1Label : stayInfo.stayAt === 'his_home' ? partner2Label : stayInfo.stayAt === 'our_home' ? `${partner1Label} & ${partner2Label}` : 'Both'}` : undefined}
                  className={`text-xs sm:text-sm md:text-base font-semibold rounded-full w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center transition-colors ${dayNumColorClass}`}
                >
                  {cell.dayNum}
                </span>
              </div>

              {/* Bottom Row: Clean event count badge (no dots or emojis) */}
              {cell.isCurrentMonth && dayEvents.length > 0 && (
                <div className="mt-auto pt-1 flex items-center justify-end">
                  {/* Mobile compact count pill */}
                  <span className="sm:hidden text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-stone-200/90 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {dayEvents.length}
                  </span>
                  {/* Tablet / Desktop larger count pill */}
                  <span className="hidden sm:inline-flex items-center text-[11px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800/90 text-stone-700 dark:text-stone-300 font-sans">
                    {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
