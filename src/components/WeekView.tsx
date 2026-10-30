import React, { useState } from 'react';
import { Home, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react';
import { CalendarEvent, DayStayInfo, EventCategory, EventSortOption, SortDirection } from '../types/calendar';
import { CATEGORY_CONFIG, formatDateToYMD, sortEventsForDay, formatTimeRange, formatUsTime, matchesPartnerFilter, eventOccursOnDate } from '../utils/calendarUtils';
import { getMoonPhase } from '../utils/astronomyUtils';
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
}) => {
  const { partner1Label, partner2Label, user1Theme, user2Theme } = useAuth();
  const [collapsedEventIds, setCollapsedEventIds] = useState<Record<string, boolean>>({});
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

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

      {/* 7 Columns Grid starting Monday, responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#e4ded5] dark:divide-[#2d3139]">
        {weekDays.map((col) => {
          const isSelected = selectedDate === col.dateStr;
          const matching = filteredEvents.filter((e) => eventOccursOnDate(e, col.dateStr));
          const dayEvents = sortEventsForDay(matching, sortOption, sortDirection);
          const stayInfo = stays[col.dateStr];

          return (
            <div
              key={col.dateStr}
              onClick={() => onSelectDate(col.dateStr)}
              className={`min-h-[280px] xl:min-h-[350px] p-2.5 sm:p-3 transition-colors flex flex-col justify-between cursor-pointer bg-[#fcfaf7] dark:bg-[#1a1d22] hover:bg-[#f6f2ea] dark:hover:bg-[#22252b] ${
                isSelected ? 'ring-2 ring-stone-900 dark:ring-stone-100 ring-inset z-10 bg-[#f5f0e6] dark:bg-[#262a32]' : ''
              }`}
            >
              <div>
                {/* Column Day Header */}
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#e4ded5] dark:border-[#2d3139]">
                  <div>
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block font-mono">
                      {col.dayName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                          col.isToday
                            ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs font-bold'
                            : 'text-stone-900 dark:text-stone-100'
                        }`}
                      >
                        {col.dayNum}
                      </span>
                      <span
                        title={`${getMoonPhase(col.date).name} (${getMoonPhase(col.date).illumination}% lit) · ${getMoonPhase(col.date).quoteTip}`}
                        className="text-xs opacity-70 hover:opacity-100 select-none cursor-help"
                      >
                        {getMoonPhase(col.date).emoji}
                      </span>
                    </div>
                  </div>

                  {/* Overnight indicator: Home icon and color coding background without text */}
                  {stayInfo && (
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

                {/* Day events with subtle category color coding */}
                <div className="space-y-1.5">
                  {dayEvents.map((evt) => {
                    const cfg = CATEGORY_CONFIG[evt.category];
                    const tasks = evt.tasks || [];
                    const completedCount = tasks.filter((t) => t.completed).length;
                    const isEventCollapsed = collapsedEventIds[evt.id] === true;
                    const isTasksExpanded = expandedTaskIds[evt.id] === true;

                    return (
                      <div
                        key={evt.id}
                        className={`p-2 rounded-lg border text-xs ${cfg.badgeBg} ${cfg.borderColor} shadow-2xs`}
                      >
                        <div className="flex items-center justify-between gap-1 leading-tight">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-xs leading-none shrink-0">{evt.emoji || cfg.emoji}</span>
                            <span className={`font-semibold truncate leading-tight ${cfg.textColor}`}>
                              {evt.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {(tasks.length > 0 || onAddTaskToEvent) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTasks(evt.id);
                                }}
                                className="font-sans text-[9px] px-1.5 py-0.2 rounded bg-white/70 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 text-stone-700 dark:text-stone-300 font-mono inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                                title={isTasksExpanded ? 'Collapse checklist tasks' : 'Expand checklist tasks'}
                              >
                                <span>{completedCount}/{tasks.length}</span>
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
                            {onDeleteEvent && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteEvent(evt.id);
                                }}
                                className="p-0.5 rounded text-stone-400 hover:text-rose-500 cursor-pointer transition-colors"
                                title="Delete event"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Secondary details row (when not collapsed) */}
                        {!isEventCollapsed && (
                          <div className="mt-1 space-y-0.5 pt-1 border-t border-black/5 dark:border-white/10">
                            <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                              {evt.startTime && <span>{formatTimeRange(evt.startTime, evt.endTime)}</span>}
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

                        {/* Independent Checklist Tasks Expansion with TaskToggleSlider & Delete button */}
                        {isTasksExpanded && (
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
                                  placeholder="Type task & press Enter to add..."
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
