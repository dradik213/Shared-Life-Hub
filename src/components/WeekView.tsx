import React, { useState, useEffect, useRef } from 'react';
import { Home, ChevronDown, ChevronUp, X, Trash2, Plus } from 'lucide-react';
import { CalendarEvent, DayStayInfo, EventCategory, EventSortOption, SortDirection, StayLocation } from '../types/calendar';
import { CATEGORY_CONFIG, formatDateToYMD, sortEventsForDay, formatTimeRange, formatUsTime, matchesPartnerFilter, eventOccursOnDate } from '../utils/calendarUtils';
import { useAuth } from '../context/AuthContext';
import { TaskToggleSlider } from './TaskToggleSlider';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  stays: Record<string, DayStayInfo>;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onToggleTask?: (eventId: string, taskId: string, completed: boolean) => void;
  onAddTaskToEvent?: (eventId: string, taskTitle: string, assignedTo?: 'both' | 'him' | 'her') => void;
  onDeleteTaskFromEvent?: (eventId: string, taskId: string) => void;
  onDeleteEvent?: (eventId: string) => void;
  categoryFilter: EventCategory | 'all';
  partnerFilter: 'all' | 'her' | 'him';
  sortOption?: EventSortOption;
  sortDirection?: SortDirection;
  expandedEventIds?: Record<string, boolean>;
  expandedTaskSections?: Record<string, boolean>;
  onToggleExpandEvent?: (eventId: string) => void;
  onToggleExpandTasks?: (eventId: string) => void;
  onUpdateStay?: (dateStr: string, stayAt: StayLocation) => void;
  onOpenDayView?: (dateStr: string) => void;
  availableBacklogTasks?: Array<{ id: string; title: string; assignedTo?: 'both' | 'him' | 'her' }>;
  onAddBacklogTaskToDate?: (task: { id: string; title: string; assignedTo?: 'both' | 'him' | 'her' }, targetDateStr: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  stays,
  selectedDate,
  onSelectDate,
  onToggleTask,
  onAddTaskToEvent,
  onDeleteTaskFromEvent,
  onDeleteEvent,
  categoryFilter,
  partnerFilter,
  sortOption = 'time',
  sortDirection = 'none',
  expandedEventIds: propsExpandedEventIds,
  expandedTaskSections: propsExpandedTaskSections,
  onToggleExpandEvent,
  onToggleExpandTasks,
  onUpdateStay,
  onOpenDayView,
  availableBacklogTasks = [],
  onAddBacklogTaskToDate,
}) => {
  const { partner1Label, partner2Label, partner1Initial, partner2Initial, user1Theme, user2Theme } = useAuth();
  const [localExpandedEventIds, setLocalExpandedEventIds] = useState<Record<string, boolean>>({});
  const [localExpandedTaskIds, setLocalExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [openBacklogPopoverDate, setOpenBacklogPopoverDate] = useState<string | null>(null);

  const currentExpandedEventIds = propsExpandedEventIds ?? localExpandedEventIds;
  const currentExpandedTaskIds = propsExpandedTaskSections ?? localExpandedTaskIds;

  const toggleEvent = (eventId: string) => {
    if (onToggleExpandEvent) {
      onToggleExpandEvent(eventId);
    } else {
      setLocalExpandedEventIds((prev) => ({
        ...prev,
        [eventId]: !prev[eventId],
      }));
    }
  };

  const toggleTasks = (eventId: string) => {
    if (onToggleExpandTasks) {
      onToggleExpandTasks(eventId);
    } else {
      setLocalExpandedTaskIds((prev) => ({
        ...prev,
        [eventId]: !prev[eventId],
      }));
    }
  };

  const handleCreateTask = (eventId: string) => {
    const val = (newTaskInputs[eventId] || '').trim();
    if (!val || !onAddTaskToEvent) return;
    onAddTaskToEvent(eventId, val, 'both');
    setNewTaskInputs((prev) => ({ ...prev, [eventId]: '' }));
  };
  const curr = new Date(currentDate);
  const dayOfWeek = (curr.getDay() + 6) % 7;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - dayOfWeek);

  const weekDays: Array<{
    date: Date;
    dateStr: string;
    dayNum: number;
    dayName: string;
    isToday: boolean;
  }> = [];

  const todayStr = formatDateToYMD(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDateToYMD(d);
    weekDays.push({
      date: d,
      dateStr,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: dateStr === todayStr
    });
  }

  // Filter events
  const filteredEvents = events.filter((evt) => {
    if (categoryFilter !== 'all' && evt.category !== categoryFilter) return false;
    return matchesPartnerFilter(evt.assignedTo, partnerFilter);
  });

  const todayColRef = useRef<HTMLDivElement | null>(null);
  const mondayColRef = useRef<HTMLDivElement | null>(null);

  const hasToday = weekDays.some((d) => d.isToday);
  if (!hasToday) {
    todayColRef.current = null;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayColRef.current) {
        todayColRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentDate]);

  return (
    <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] shadow-2xs overflow-hidden transition-colors">
      {/* 7-Day Week Flow Header */}
      <div className="p-2.5 px-3 bg-[#f5f1e8] dark:bg-[#202329] border-b border-[#e4ded5] dark:border-[#2d3139] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono uppercase tracking-wider text-[11px]">
            7-Day Week Flow
          </span>
          <span className="text-stone-400">·</span>
          <span className="text-stone-600 dark:text-stone-300">
            {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* 7 Days Stacked Vertically Across All Screens */}
      <div className="flex flex-col divide-y divide-[#e4ded5] dark:divide-[#2d3139] w-full">
        {weekDays.map((col, idx) => {
          const isSelected = selectedDate === col.dateStr;
          const matching = filteredEvents.filter((e) => eventOccursOnDate(e, col.dateStr));
          const dayEvents = sortEventsForDay(matching, sortOption, sortDirection === 'none' ? 'asc' : sortDirection);
          const stayInfo = stays[col.dateStr];
          const shortDateLabel = col.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const stayPillColor = 
            stayInfo?.stayAt === 'her_home'
              ? user1Theme.badgeBg
              : stayInfo?.stayAt === 'his_home'
              ? user2Theme.badgeBg
              : stayInfo?.stayAt === 'our_home'
              ? 'bg-stone-200/90 text-stone-700 dark:bg-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-600'
              : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700';

          return (
            <div
              key={col.dateStr}
              ref={(el) => {
                if (idx === 0) mondayColRef.current = el;
                if (col.isToday) todayColRef.current = el;
              }}
              onClick={() => onSelectDate(col.dateStr)}
              className={`scroll-mt-28 py-3 px-3 sm:px-4 w-full transition-colors flex flex-col justify-between cursor-pointer bg-[#fcfaf7] dark:bg-[#1a1d22] hover:bg-[#f6f2ea] dark:hover:bg-[#22252b] ${
                isSelected ? 'ring-2 ring-stone-900 dark:ring-stone-100 ring-inset z-10 bg-[#f5f0e6] dark:bg-[#262a32]' : ''
              }`}
            >
              <div>
                {/* Column Day Header - Unified Single Line Row */}
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#e4ded5] dark:border-[#2d3139] gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    {/* Consistent [🏠 Tue, Nov 3] Stay Pill */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateStay) {
                          const cycle: StayLocation[] = ['our_home', 'her_home', 'his_home'];
                          const currentStay: StayLocation = stayInfo?.stayAt || 'our_home';
                          const currentIndex = cycle.indexOf(currentStay);
                          const nextStay = cycle[(currentIndex + 1) % cycle.length];
                          onUpdateStay(col.dateStr, nextStay);
                        }
                      }}
                      title={stayInfo ? `Stay: ${stayInfo.stayAt === 'her_home' ? partner1Label : stayInfo.stayAt === 'his_home' ? partner2Label : `${partner1Label} & ${partner2Label}`}${onUpdateStay ? ' (Click to change stay)' : ''}` : onUpdateStay ? 'Click to set stay' : undefined}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover:opacity-90 active:scale-95 shrink-0 ${stayPillColor}`}
                    >
                      <Home className="w-3 h-3 shrink-0 opacity-80" />
                      <span>{shortDateLabel}</span>
                    </button>

                    {/* Consistent + Backlog ({count}) Pill */}
                    {availableBacklogTasks && availableBacklogTasks.length > 0 && onAddBacklogTaskToDate && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenBacklogPopoverDate(openBacklogPopoverDate === col.dateStr ? null : col.dateStr);
                          }}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer shrink-0"
                          title={`Add task from Backlog (${availableBacklogTasks.length} available)`}
                        >
                          + Backlog ({availableBacklogTasks.length})
                        </button>
                        {openBacklogPopoverDate === col.dateStr && (
                          <div
                            className="absolute left-0 top-full mt-1.5 w-72 max-h-56 overflow-y-auto bg-white dark:bg-[#202329] border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-30 p-2 space-y-1.5 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-stone-800">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                Backlog ({availableBacklogTasks.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => setOpenBacklogPopoverDate(null)}
                                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="space-y-1">
                              {availableBacklogTasks.map((t) => (
                                <div
                                  key={t.id}
                                  className="p-1.5 rounded-lg bg-stone-50 dark:bg-[#282c35] border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between gap-1.5 text-xs"
                                >
                                  <div className="truncate flex-1 min-w-0">
                                    <span className="font-medium text-stone-800 dark:text-stone-200 block truncate text-[11px]">
                                      {t.title}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onAddBacklogTaskToDate(t, col.dateStr);
                                      setOpenBacklogPopoverDate(null);
                                    }}
                                    className="w-6 h-6 rounded-md bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center shrink-0 cursor-pointer hover:bg-stone-800 dark:hover:bg-white text-xs font-bold"
                                    title="Add to day"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side: Item count & Day View link */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                    </span>
                    {onOpenDayView && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDayView(col.dateStr);
                        }}
                        className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:underline cursor-pointer"
                        title="Open in Day View"
                      >
                        Day View →
                      </button>
                    )}
                  </div>
                </div>

                {/* Day events with subtle category color coding */}
                <div className="space-y-1.5">
                  {dayEvents.map((evt) => {
                    const cfg = CATEGORY_CONFIG[evt.category];
                    const tasks = evt.tasks || [];
                    const completedCount = tasks.filter((t) => t.completed).length;
                    const isEventExpanded = currentExpandedEventIds[evt.id] === true;
                    const isTasksExpanded = currentExpandedTaskIds[evt.id] === true;
                    const partnerBadge = evt.assignedTo === 'her' ? partner1Initial : evt.assignedTo === 'him' ? partner2Initial : `${partner1Initial}&${partner2Initial}`;

                    return (
                      <div
                        key={evt.id}
                        className="p-2 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1a1d24] text-xs shadow-2xs space-y-1.5"
                      >
                        {/* Event Header: Row 1 = Full Untruncated Title with subtle category dot, Row 2 = Time + Partner on Left, Tasks + Chevron on Right */}
                        <div
                          onClick={() => toggleEvent(evt.id)}
                          className="cursor-pointer select-none space-y-1.5"
                        >
                          {/* Row 1: Full-width untruncated title with subtle category dot */}
                          <div className="w-full flex items-start gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dotColor || 'bg-stone-400'}`} />
                            <h4 className="text-xs sm:text-sm font-semibold leading-snug break-words text-stone-900 dark:text-stone-100 flex-1">
                              {evt.title}
                            </h4>
                          </div>

                          {/* Row 2: Secondary info & controls */}
                          <div className="flex items-center justify-between gap-1 leading-tight pt-0.5">
                            {/* Left: Time + Partner Badge */}
                            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                              <span className="font-mono text-[10px] font-medium text-stone-700 dark:text-stone-300">
                                {evt.startTime ? formatTimeRange(evt.startTime, evt.endTime) : 'All Day'}
                              </span>
                              <span className={`text-[9px] font-bold px-1 py-0.2 rounded border ${
                                evt.assignedTo === 'her'
                                  ? user1Theme.badgeBg
                                  : evt.assignedTo === 'him'
                                  ? user2Theme.badgeBg
                                  : 'bg-stone-200/80 dark:bg-stone-700/80 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600'
                              }`}>
                                {partnerBadge}
                              </span>
                            </div>

                            {/* Right: Tasks Button + Chevron */}
                            <div className="flex items-center gap-1 shrink-0">
                              {(tasks.length > 0 || onAddTaskToEvent) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTasks(evt.id);
                                  }}
                                  className="font-mono text-xs font-semibold px-2.5 py-1 min-h-[28px] rounded-md bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200/90 dark:border-stone-700 text-stone-700 dark:text-stone-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  title={isTasksExpanded ? 'Collapse checklist tasks' : 'Expand checklist tasks'}
                                >
                                  <span>{completedCount}/{tasks.length}</span>
                                  {isTasksExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEvent(evt.id);
                                }}
                                className="p-1.5 min-w-[28px] min-h-[28px] rounded-md bg-stone-100/70 hover:bg-stone-200/80 dark:bg-stone-800/60 dark:hover:bg-stone-700 border border-stone-200/70 dark:border-stone-700/70 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center cursor-pointer transition-colors"
                                title={isEventExpanded ? 'Collapse event details' : 'Expand event details'}
                              >
                                {isEventExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Secondary details row (when not collapsed) */}
                        {isEventExpanded && (
                          <div className="mt-1 space-y-1 pt-1 border-t border-black/5 dark:border-white/10">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-medium text-stone-600 dark:text-stone-400">
                                {cfg.label}
                              </span>
                              {onDeleteEvent && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteEvent(evt.id);
                                  }}
                                  className="p-0.5 rounded text-stone-400 hover:text-rose-500 cursor-pointer transition-colors shrink-0"
                                  title="Delete event"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {evt.locationName && (
                              <div className="text-[10px] text-stone-600 dark:text-stone-400 truncate font-sans">
                                {evt.locationName}
                              </div>
                            )}
                            {evt.notes && (
                              <div className="text-[9.5px] text-stone-500 dark:text-stone-400 truncate font-sans italic">
                                {evt.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Independent Checklist Tasks Expansion with TaskToggleSlider & Delete button, or when expanded with 0 tasks */}
                        {(isTasksExpanded || (isEventExpanded && tasks.length === 0)) && (
                          <div className="mt-1.5 pt-1.5 border-t border-black/10 dark:border-white/10 space-y-1.5">
                            {tasks.map((task) => (
                              <div
                                key={task.id}
                                className={`p-1.5 rounded-md border flex items-center justify-between gap-1.5 transition-colors ${
                                  task.completed
                                    ? 'bg-stone-100/70 dark:bg-[#1f2229] border-stone-200 dark:border-stone-800 text-stone-400'
                                    : 'bg-white/80 dark:bg-[#22252c] border-stone-200/80 dark:border-stone-700/60 text-stone-800 dark:text-stone-200'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <TaskToggleSlider
                                    checked={task.completed}
                                    onChange={(newChecked) => onToggleTask && onToggleTask(evt.id, task.id, newChecked)}
                                    label={task.title}
                                  />
                                  <span className={`text-[10px] ${task.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-800 dark:text-stone-200'} truncate`}>
                                    {task.title}
                                  </span>
                                </div>
                                {onDeleteTaskFromEvent && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTaskFromEvent(evt.id, task.id);
                                    }}
                                    className="text-stone-300 hover:text-rose-500 p-0.5 cursor-pointer transition-colors"
                                    title="Delete task"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {/* Type task & press Enter to add... input */}
                            {onAddTaskToEvent && (
                              <div className="pt-0.5 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  placeholder="Add task..."
                                  value={newTaskInputs[evt.id] || ''}
                                  onChange={(e) =>
                                    setNewTaskInputs((prev) => ({ ...prev, [evt.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleCreateTask(evt.id);
                                    }
                                  }}
                                  className="w-full text-[10px] px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-400 font-sans"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {dayEvents.length === 0 && (
                    <div className="py-3 text-center text-[10px] text-stone-400">
                      Free day
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
