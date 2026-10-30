import React, { useState } from 'react';
import { Home, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { CalendarEvent, DayStayInfo, EventCategory, EventSortOption, SortDirection } from '../types/calendar';
import { CATEGORY_CONFIG, getMonthMatrix, sortEventsForDay, formatTimeRange, formatUsTime, matchesPartnerFilter, eventOccursOnDate } from '../utils/calendarUtils';
import { getMoonPhase } from '../utils/astronomyUtils';
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
  onToggleTask,
  categoryFilter,
  partnerFilter,
  sortOption = 'time',
  sortDirection = 'none',
}) => {
  const { partner1Label, partner2Label, partner1Initial, partner2Initial, user1Theme, user2Theme } = useAuth();
  const [collapsedEventIds, setCollapsedEventIds] = useState<Record<string, boolean>>({});
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  const toggleEvent = (eventId: string) => {
    setCollapsedEventIds((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const toggleTasks = (eventId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

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
          const dayEvents = sortEventsForDay(eventsByDate[cell.dateStr] || [], sortOption, sortDirection);
          const stayInfo = stays[cell.dateStr];
          const moon = getMoonPhase(cell.date);

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[60px] md:min-h-[135px] lg:min-h-[160px] xl:min-h-[180px] p-1 md:p-2 sm:p-2.5 transition-all cursor-pointer relative group flex flex-col justify-between ${
                !cell.isCurrentMonth
                  ? 'bg-[#f3f0e8]/40 dark:bg-[#16181c]/50 text-stone-400 dark:text-stone-600'
                  : 'bg-[#fcfaf6] dark:bg-[#1d2026] hover:bg-[#f6f2ea] dark:hover:bg-[#23272e] text-stone-800 dark:text-stone-200'
              } ${isSelected ? 'ring-2 ring-stone-900 dark:ring-stone-100 ring-inset z-10 bg-[#f5f0e6] dark:bg-[#262a32]' : ''}`}
            >
              {/* Mobile View: Compact cell with Day number, Stay badge letter, and category dots + event count */}
              <div className="md:hidden flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                      cell.isToday
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-bold'
                        : cell.isCurrentMonth
                        ? 'text-stone-800 dark:text-stone-200'
                        : 'text-stone-400 dark:text-stone-600'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {stayInfo && cell.isCurrentMonth && (
                    <span
                      title={`Stay: ${stayInfo.stayAt === 'our_home' ? 'Our Home' : stayInfo.stayAt === 'her_home' ? partner1Label : partner2Label}`}
                      className={`w-4 h-4 rounded-xs text-[9px] font-bold flex items-center justify-center uppercase shadow-2xs ${
                        stayInfo.stayAt === 'our_home'
                          ? 'bg-black text-white dark:bg-stone-900 dark:text-white'
                          : stayInfo.stayAt === 'her_home'
                          ? user1Theme.badgeBg
                          : user2Theme.badgeBg
                      }`}
                    >
                      {stayInfo.stayAt === 'our_home' ? 'H' : stayInfo.stayAt === 'her_home' ? partner1Initial : partner2Initial}
                    </span>
                  )}
                </div>

                {/* Category dots + event count badge */}
                {cell.isCurrentMonth && dayEvents.length > 0 && (
                  <div className="mt-1 flex items-center justify-between gap-0.5">
                    <div className="flex items-center gap-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const cfg = CATEGORY_CONFIG[evt.category];
                        return (
                          <span
                            key={evt.id}
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotColor || 'bg-stone-500'}`}
                            title={evt.title}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold leading-none">
                      {dayEvents.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Desktop View: Full rich expandable event pills with inline tasks */}
              <div className="hidden md:block">
                {/* Day Header Row: Day number + Moon phase + Stay location indicator ("Hers" / "His" / "Home") */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    {/* Fixed hover issue: in night view, day number stays bright white on hover */}
                    <span
                      className={`text-xs sm:text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center transition-colors ${
                        cell.isToday
                          ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs font-bold'
                          : cell.isCurrentMonth
                          ? 'text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white'
                          : 'text-stone-400 dark:text-stone-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {cell.isCurrentMonth && (
                      <span
                        title={`${moon.name} (${moon.illumination}% lit) · ${moon.quoteTip}`}
                        className="text-xs opacity-65 group-hover:opacity-100 hover:scale-110 transition-all select-none cursor-help"
                      >
                        {moon.emoji}
                      </span>
                    )}
                  </div>

                  {/* Overnight indicator: Home icon and color coding background without text */}
                  {stayInfo && cell.isCurrentMonth && (
                    <div
                      title={`Stay: ${stayInfo.stayAt === 'our_home' ? 'Our Home' : stayInfo.stayAt === 'her_home' ? partner1Label : partner2Label}`}
                      className={`inline-flex items-center justify-center p-1 rounded transition-colors shadow-2xs ${
                        stayInfo.stayAt === 'our_home'
                          ? 'bg-black text-white dark:bg-stone-900 dark:text-white border border-stone-800'
                          : stayInfo.stayAt === 'her_home'
                          ? user1Theme.badgeBg
                          : user2Theme.badgeBg
                      }`}
                    >
                      <Home className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Events list with category background color matching */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((evt) => {
                    const cfg = CATEGORY_CONFIG[evt.category];
                    const tasks = evt.tasks || [];
                    const completedTasks = tasks.filter((t) => t.completed).length;
                    const isEventCollapsed = collapsedEventIds[evt.id] === true;
                    const isTasksExpanded = expandedTaskIds[evt.id] === true;

                    return (
                      <div
                        key={evt.id}
                        className={`text-[11px] p-1.5 rounded border transition-colors ${cfg.badgeBg} ${cfg.borderColor} hover:border-stone-400 dark:hover:border-stone-500`}
                      >
                        <div className="flex items-center justify-between gap-1 leading-tight">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <span className="text-[10px] shrink-0 leading-none">{evt.emoji || cfg.emoji}</span>
                            <span className={`font-medium truncate ${cfg.textColor}`}>
                              {evt.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {tasks.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTasks(evt.id);
                                }}
                                className="font-sans text-[9px] px-1 py-0.2 rounded bg-white/70 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 text-stone-700 dark:text-stone-300 font-mono inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                                title={isTasksExpanded ? 'Collapse checklist tasks' : 'Expand checklist tasks'}
                              >
                                <span>{completedTasks}/{tasks.length}</span>
                                {isTasksExpanded ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEvent(evt.id);
                              }}
                              className="p-0.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer transition-colors"
                              title={isEventCollapsed ? 'Expand event details' : 'Collapse event details'}
                            >
                              {isEventCollapsed ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Secondary details row (when not collapsed) */}
                        {!isEventCollapsed && (
                          <div className="mt-1 space-y-0.5 pt-0.5 border-t border-black/5 dark:border-white/10">
                            <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                              {evt.startTime && <span>{formatTimeRange(evt.startTime, evt.endTime)}</span>}
                            </div>
                            {evt.locationName && (
                              <div className="text-[9.5px] text-stone-600 dark:text-stone-400 truncate font-sans">
                                {evt.locationName}
                              </div>
                            )}
                            {evt.notes && (
                              <div className="text-[9px] text-stone-500 dark:text-stone-400 truncate font-sans italic">
                                {evt.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Independent Checklist Tasks Expansion */}
                        {isTasksExpanded && tasks.length > 0 && (
                          <div className="mt-1 pt-1 border-t border-black/10 dark:border-white/10 space-y-0.5">
                            {tasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onToggleTask) {
                                    onToggleTask(evt.id, task.id, !task.completed);
                                  }
                                }}
                                className="flex items-center gap-1.5 text-[10px] cursor-pointer hover:opacity-80 select-none py-0.5"
                                title={onToggleTask ? 'Click to toggle completion' : task.title}
                              >
                                <span className={`w-2.5 h-2.5 rounded-xs border flex items-center justify-center shrink-0 ${
                                  task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-400 dark:border-stone-500 bg-white dark:bg-black/40'
                                }`}>
                                  {task.completed && <Check className="w-2 h-2 stroke-[3]" />}
                                </span>
                                <span className={`truncate text-[9.5px] ${task.completed ? 'line-through opacity-60 text-stone-500' : 'text-stone-800 dark:text-stone-200'}`}>
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 font-medium px-1">
                      + {dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
