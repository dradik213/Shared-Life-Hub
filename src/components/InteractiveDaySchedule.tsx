import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Home, 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  X, 
  FileText, 
  DollarSign, 
  RotateCcw, 
  Copy, 
  Edit3,
  CheckCircle2,
  Trash2,
  Sparkles,
  Calendar as CalendarIcon,
  Store,
  UtensilsCrossed,
  Wrench,
  Luggage,
  ShoppingCart,
  Barcode,
  ShoppingBag
} from 'lucide-react';
import { CalendarEvent, DayStayInfo, EventCategory, EventSortOption, EventTask, MarketPackoutItem, MarketSaleRecord, SortDirection, StayLocation } from '../types/calendar';
import { CATEGORY_CONFIG, formatReadableDate, sortEventsForDay, formatTimeRange, formatUsTime, formatDateToYMD, matchesPartnerFilter, eventOccursOnDate } from '../utils/calendarUtils';
import { getMoonPhase } from '../utils/astronomyUtils';
import { TaskToggleSlider } from './TaskToggleSlider';
import { useAuth } from '../context/AuthContext';
import { GoogleTaskItem } from '../utils/googleWorkspace';
import { MarketPackoutModal } from './MarketPackoutModal';
import { PointOfSaleRegisterModal } from './PointOfSaleRegisterModal';

interface InteractiveDayScheduleProps {
  currentDate?: Date;
  selectedDate: string;
  onSelectDate?: (dateStr: string) => void;
  events: CalendarEvent[];
  allEvents: CalendarEvent[];
  stays: Record<string, DayStayInfo>;
  googleTasks?: GoogleTaskItem[];
  onUpdateStay: (date: string, stay: StayLocation) => void;
  onUpdateStayNotes?: (date: string, notes: string) => void;
  onToggleTask: (eventId: string, taskId: string, completed: boolean) => void;
  onAddTaskToEvent: (eventId: string, taskTitle: string, assignedTo?: 'both' | 'him' | 'her') => void;
  onDeleteTaskFromEvent: (eventId: string, taskId: string) => void;
  onCopyTaskToDate: (sourceTaskTitle: string, targetDate: string, assignedTo?: 'both' | 'him' | 'her') => void;
  onUpdateEvent?: (updatedEvent: CalendarEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onOpenFridgePhotos: () => void;
  onOpenAddModal?: (dateStr?: string) => void;
  categoryFilter: EventCategory | 'all';
  partnerFilter: 'all' | 'her' | 'him';
  sortOption?: EventSortOption;
  sortDirection?: SortDirection;
  expandedEventIds?: Record<string, boolean>;
  expandedTaskSections?: Record<string, boolean>;
  onToggleExpandEvent?: (eventId: string) => void;
  onToggleExpandTasks?: (eventId: string) => void;
}

export const InteractiveDaySchedule: React.FC<InteractiveDayScheduleProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  events,
  allEvents,
  stays,
  googleTasks = [],
  onUpdateStay,
  onUpdateStayNotes,
  onToggleTask,
  onAddTaskToEvent,
  onDeleteTaskFromEvent,
  onCopyTaskToDate,
  onUpdateEvent,
  onDeleteEvent,
  onOpenFridgePhotos,
  onOpenAddModal,
  categoryFilter,
  partnerFilter,
  sortOption = 'time',
  sortDirection = 'none',
  expandedEventIds: propsExpandedEventIds,
  expandedTaskSections: propsExpandedTaskSections,
  onToggleExpandEvent,
  onToggleExpandTasks,
}) => {
  const { 
    partner1Label, 
    partner2Label, 
    partner1Initial, 
    partner2Initial, 
    partner1DisplayName, 
    partner2DisplayName, 
    user1Theme, 
    user2Theme 
  } = useAuth();
  const [localExpandedEventIds, setLocalExpandedEventIds] = useState<Record<string, boolean>>({});
  const [localExpandedTaskSections, setLocalExpandedTaskSections] = useState<Record<string, boolean>>({});

  const currentExpandedEventIds = propsExpandedEventIds ?? localExpandedEventIds;
  const currentExpandedTaskSections = propsExpandedTaskSections ?? localExpandedTaskSections;

  const [dayNotes, setDayNotes] = useState(stays[selectedDate]?.notes || '');
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [newTaskAssignees, setNewTaskAssignees] = useState<Record<string, 'both' | 'him' | 'her'>>({});
  
  // State for Editing Event Details
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [packoutEvent, setPackoutEvent] = useState<CalendarEvent | null>(null);
  const [posEvent, setPosEvent] = useState<CalendarEvent | null>(null);
  const [showRolloverDrawer, setShowRolloverDrawer] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);

  // Sync day notes when selectedDate changes so notes don't stick across days
  const currentStayNotes = stays[selectedDate]?.notes || '';
  useEffect(() => {
    setDayNotes(currentStayNotes);
  }, [selectedDate, currentStayNotes]);

  // Filter events for this specific day (supporting multi-day spans) and sort using chosen sortOption
  const filteredDayEvents = events
    .filter((e) => eventOccursOnDate(e, selectedDate))
    .filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      return matchesPartnerFilter(e.assignedTo, partnerFilter);
    });

  const dayEvents = sortEventsForDay(filteredDayEvents, sortOption, sortDirection);

  const toggleEventExpanded = (id: string) => {
    if (onToggleExpandEvent) {
      onToggleExpandEvent(id);
    } else {
      setLocalExpandedEventIds((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const toggleTaskSection = (eventId: string) => {
    if (onToggleExpandTasks) {
      onToggleExpandTasks(eventId);
    } else {
      setLocalExpandedTaskSections((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
    }
  };

  const handleNotesChange = (val: string) => {
    setDayNotes(val);
    if (onUpdateStayNotes) {
      onUpdateStayNotes(selectedDate, val);
    }
  };

  const handleInsertBullet = () => {
    const bulletText = dayNotes ? `${dayNotes}\n• ` : '• ';
    handleNotesChange(bulletText);
  };

  const handleInsertBreak = () => {
    const breakText = `${dayNotes}\n\n`;
    handleNotesChange(breakText);
  };

  const handleCreateTask = (eventId: string) => {
    const text = newTaskInputs[eventId]?.trim();
    if (!text) return;
    onAddTaskToEvent(eventId, text, 'both');
    setNewTaskInputs((prev) => ({ ...prev, [eventId]: '' }));
  };

  const stayInfo = stays[selectedDate];
  const currentStay: StayLocation = stayInfo?.stayAt || 'her_home';

  const handleCycleStay = () => {
    if (currentStay === 'her_home') {
      onUpdateStay(selectedDate, 'our_home');
    } else if (currentStay === 'our_home') {
      onUpdateStay(selectedDate, 'his_home');
    } else {
      onUpdateStay(selectedDate, 'her_home');
    }
  };

  // Dynamic photo count for active hub
  const [photoCount, setPhotoCount] = useState<number>(0);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hub_fridge_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPhotoCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setPhotoCount(0);
      }
    } catch (e) {
      setPhotoCount(0);
    }
  }, [selectedDate]);

  // Unified Backlog: Checklist tasks marked not completed from past dates + Google Tasks
  const TODAY_STR = formatDateToYMD(new Date());
  
  interface UnifiedBacklogItem {
    id: string;
    title: string;
    sourceType: 'checklist' | 'google_task';
    sourceDetail: string;
    assignedTo?: 'both' | 'him' | 'her';
  }

  const allBacklogTasks: UnifiedBacklogItem[] = [];

  // 1. Checklist items marked not completed from past dates
  allEvents.forEach((evt) => {
    if (evt.startDate < TODAY_STR && evt.tasks) {
      evt.tasks.forEach((t) => {
        if (!t.completed) {
          allBacklogTasks.push({
            id: t.id,
            title: t.title,
            sourceType: 'checklist',
            sourceDetail: `Uncompleted Checklist · ${formatReadableDate(evt.startDate)} · ${evt.title}`,
            assignedTo: t.assignedTo,
          });
        }
      });
    }
  });

  // 2. Google Tasks immediately in the same backlog bucket!
  googleTasks.forEach((gt) => {
    if (gt.status !== 'completed') {
      allBacklogTasks.push({
        id: `gt-${gt.id}`,
        title: gt.title,
        sourceType: 'google_task',
        sourceDetail: gt.due ? `Google Tasks · Due ${formatReadableDate(gt.due.split('T')[0])}` : 'Google Tasks Backlog',
        assignedTo: 'both',
      });
    }
  });

  const handleCopyTask = (title: string, assignedTo?: 'both' | 'him' | 'her') => {
    onCopyTaskToDate(title, selectedDate, assignedTo);
    setCopyFeedback(`Added "${title}" to today's schedule!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Save changes to event being edited
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent && onUpdateEvent) {
      onUpdateEvent(editingEvent);
      setEditingEvent(null);
    }
  };

  const handleSavePackout = (eventId: string, updatedInventory: MarketPackoutItem[]) => {
    const target = allEvents.find((e) => e.id === eventId);
    if (target && onUpdateEvent) {
      onUpdateEvent({
        ...target,
        marketDetails: {
          ...target.marketDetails,
          inventory: updatedInventory
        }
      });
    }
  };

  const handleCompleteSale = (
    eventId: string,
    sale: MarketSaleRecord,
    updatedRevenue: number,
    updatedInventory?: MarketPackoutItem[]
  ) => {
    const target = allEvents.find((e) => e.id === eventId);
    if (target && onUpdateEvent) {
      const prevSales = target.marketDetails?.sales || [];
      onUpdateEvent({
        ...target,
        marketDetails: {
          ...target.marketDetails,
          actualRevenue: updatedRevenue,
          sales: [sale, ...prevSales],
          inventory: updatedInventory || target.marketDetails?.inventory
        }
      });
    }
  };

  const [sy, sm, sd] = selectedDate.split('-').map(Number);
  const moon = getMoonPhase(new Date(sy, sm - 1, sd, 12, 0, 0));

  return (
    <div className="space-y-4 pb-24">
      
      {/* Copy feedback toast if any */}
      {copyFeedback && (
        <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Unified Backlog Tasks: Compact Collapsible Pill */}
      {allBacklogTasks.length > 0 && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 overflow-hidden text-xs transition-colors">
          <button
            type="button"
            onClick={() => setShowRolloverDrawer(!showRolloverDrawer)}
            className="w-full py-1.5 px-3 flex items-center justify-between text-left hover:bg-amber-100/50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-xs">
              <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{allBacklogTasks.length} Tasks in Backlog</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              <span>{showRolloverDrawer ? 'Hide' : 'Review & Add'}</span>
              {showRolloverDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showRolloverDrawer && (
            <div className="p-3 border-t border-amber-200 dark:border-amber-900/50 bg-[#fffdfa] dark:bg-[#1e2127] space-y-2">
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Unfinished checklist items and Google Tasks in your backlog. Click "Add to Today" to pull them into this schedule:
              </p>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {allBacklogTasks.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded bg-[#fcfaf7] dark:bg-[#252830] border border-[#e4ded5] dark:border-[#353943] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          item.sourceType === 'google_task'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {item.sourceType === 'google_task' ? 'Google Task' : 'Unfinished Tag'}
                        </span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate mt-0.5">
                        {item.sourceDetail}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyTask(item.title, item.assignedTo)}
                      className="bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-[10px] font-semibold px-2.5 py-1 rounded shadow-2xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>Add to Today</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Interactive Colorful Event Cards List ("Working the Day") */}
      {dayEvents.length === 0 ? (
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-dashed border-[#e4ded5] dark:border-[#2d3139] p-8 sm:p-10 text-center text-xs space-y-3 transition-colors">
          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-[#252830] flex items-center justify-center mx-auto text-stone-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-stone-700 dark:text-stone-300 font-semibold text-sm">
              No activities scheduled for this day
            </p>
            <p className="text-stone-400 text-xs mt-1">
              Add a market, date night, home repair, or grocery run to work through this day.
            </p>
          </div>
          {onOpenAddModal && (
            <button
              type="button"
              onClick={() => onOpenAddModal(selectedDate)}
              className="inline-flex items-center gap-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Plan for Today</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 relative w-full">
          {dayEvents.map((evt) => {
            const cfg = CATEGORY_CONFIG[evt.category];
            const tasks = evt.tasks || [];
            const completedCount = tasks.filter((t) => t.completed).length;
            const isExpanded = Boolean(currentExpandedEventIds[evt.id]);
            const isTasksExpanded = Boolean(currentExpandedTaskSections[evt.id]);
            const partnerLabel = evt.assignedTo === 'her' ? partner1Label : evt.assignedTo === 'him' ? partner2Label : 'Both';
            const allTasksDone = tasks.length > 0 && completedCount === tasks.length;

            return (
              <div
                key={evt.id}
                className={`w-full relative rounded-xl border transition-all shadow-xs overflow-hidden ${cfg.badgeBg} ${cfg.borderColor}`}
              >
                {/* Event Card Header - 2-row vertical stack */}
                <div
                  onClick={() => toggleEventExpanded(evt.id)}
                  className="flex flex-col gap-1.5 p-3 sm:p-3.5 cursor-pointer select-none hover:opacity-95 transition-opacity"
                >
                  {/* Row 1: Full Width Untruncated Title */}
                  <h3 className={`text-xs sm:text-sm md:text-base font-semibold leading-snug break-words ${cfg.textColor}`}>
                    {evt.title}
                  </h3>

                  {/* Row 2: Metadata & Controls Row */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Left side: Time range + Partner Initial badge */}
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="font-mono text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{evt.startTime ? formatTimeRange(evt.startTime, evt.endTime) : 'All Day'}</span>
                      </span>
                      <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded border ${
                        evt.assignedTo === 'her'
                          ? user1Theme.badgeBg
                          : evt.assignedTo === 'him'
                          ? user2Theme.badgeBg
                          : 'bg-stone-200/80 dark:bg-stone-700/80 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600'
                      }`}>
                        {evt.assignedTo === 'her' ? partner1Initial : evt.assignedTo === 'him' ? partner2Initial : `${partner1Initial}&${partner2Initial}`}
                      </span>
                    </div>

                    {/* Right side: Task count pill & chevron */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tasks.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskSection(evt.id);
                          }}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-white/70 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 px-2 py-0.5 rounded border border-black/5 dark:border-white/10 cursor-pointer transition-colors"
                          title={isTasksExpanded ? "Collapse checklist tasks" : "Expand checklist tasks"}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${allTasksDone ? 'text-emerald-600' : 'text-stone-500'}`} />
                          <span>{completedCount}/{tasks.length}</span>
                          {isTasksExpanded ? (
                            <ChevronUp className="w-3 h-3 text-stone-500" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-stone-500" />
                          )}
                        </button>
                      )}

                      <div className="flex items-center text-stone-500 p-0.5">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-4 pt-3 border-t border-stone-200/70 dark:border-stone-800/70 bg-white/85 dark:bg-[#1a1d22]/95 space-y-4">
                    {/* Secondary detail row: Category label, Partner label, Location */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          evt.assignedTo === 'her'
                            ? user1Theme.badgeBg
                            : evt.assignedTo === 'him'
                            ? user2Theme.badgeBg
                            : 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700'
                        }`}>
                          {partnerLabel}
                        </span>
                        <span className="text-xs opacity-80 font-medium">
                          · {cfg.shortLabel}
                        </span>
                        {evt.locationName && (
                          <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                            <MapPin className="w-3.5 h-3.5 text-stone-500" />
                            <span>{evt.locationName}</span>
                          </span>
                        )}
                      </div>

                      {/* Edit and Delete Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent({ ...evt });
                          }}
                          className="p-1.5 rounded-lg bg-white/70 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                          title="Edit event details"
                        >
                          <Edit3 className="w-3 h-3 text-stone-600 dark:text-stone-400" />
                          <span className="hidden sm:inline">Edit Details</span>
                        </button>

                        {onDeleteEvent && (
                          confirmDeleteEventId === evt.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteEvent(evt.id);
                                  setConfirmDeleteEventId(null);
                                }}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                Confirm Delete?
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteEventId(null)}
                                className="px-1 text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteEventId(evt.id)}
                              className="text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer text-xs p-1.5 rounded-lg border border-stone-200/60 dark:border-stone-700/60"
                              title="Delete event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Multiline Notes Display */}
                    {evt.notes && (
                      <div className="p-3 rounded-lg bg-stone-50/90 dark:bg-[#252830] border border-stone-200/80 dark:border-stone-700/60 text-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed font-sans">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1">
                          Event Notes & Instructions:
                        </span>
                        {evt.notes}
                      </div>
                    )}

                    {/* Pop-Up Market Details, Packout Inventory & Register Actions */}
                    {(evt.category === 'market' || evt.marketDetails) && (
                      <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-sans block">Booth Stall</span>
                            <span className="font-bold text-stone-900 dark:text-stone-100">{evt.marketDetails?.boothNumber || 'Assigned'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-sans block">Booth Fee</span>
                            <span className="font-bold text-stone-900 dark:text-stone-100">${evt.marketDetails?.boothFee || 0}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-sans block">Target Sales</span>
                            <span className="font-bold text-stone-900 dark:text-stone-100">${evt.marketDetails?.targetRevenue || 0}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-sans block">Actual Sales</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ${(evt.marketDetails?.actualRevenue || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Market Action Bar: [Inventory] and [Register] Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/80 dark:border-amber-900/40">
                          <div className="text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                            {evt.marketDetails?.inventory && evt.marketDetails.inventory.length > 0 ? (
                              <span>
                                📦 <strong>{evt.marketDetails.inventory.reduce((a, b) => a + b.quantityPacked, 0)} items packed</strong> (${evt.marketDetails.inventory.reduce((a, b) => a + (b.quantityPacked * b.price), 0).toFixed(2)})
                              </span>
                            ) : (
                              <span className="text-amber-700/80 dark:text-amber-400/80 italic text-[11px]">
                                No items logged for this market yet.
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPackoutEvent(evt);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1d22] hover:bg-amber-100/60 dark:hover:bg-[#252830] border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              title="Scan barcodes to log items brought to this market"
                            >
                              <Barcode className="w-3.5 h-3.5 text-amber-700" />
                              <span>Inventory</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPosEvent(evt);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                              title="Open Point of Sale register (scan barcodes, cash, card scanner, Venmo QR)"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Register</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Independent Tasks Section: Rendered if card is expanded OR if user clicked task pill */}
                {(isExpanded || (isTasksExpanded && tasks.length > 0)) && (
                  <div className="p-4 pt-3 border-t border-stone-200/70 dark:border-stone-800/70 bg-white/95 dark:bg-[#1a1d22]/95 space-y-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskSection(evt.id);
                      }}
                      className="w-full flex items-center justify-between text-xs cursor-pointer select-none group text-left"
                      title={isTasksExpanded ? 'Collapse checklist tasks' : 'Expand checklist tasks'}
                    >
                      <span className="font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 font-mono text-[11px] flex items-center gap-1.5 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-500" />
                        <span>Checklist Tasks ({completedCount}/{tasks.length})</span>
                        {isTasksExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                        )}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">
                        {isTasksExpanded ? 'Click to hide tasks' : 'Click to show tasks'}
                      </span>
                    </button>

                    {isTasksExpanded && (
                      <>
                        {tasks.length > 0 ? (
                          <div className="space-y-1.5">
                            {tasks.map((task) => (
                              <div
                                key={task.id}
                                className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                                  task.completed
                                    ? 'bg-stone-100/70 dark:bg-[#1f2229] border-stone-200 dark:border-stone-800 text-stone-400'
                                    : 'bg-stone-50 dark:bg-[#22252c] border-stone-200/80 dark:border-stone-700/60 text-stone-800 dark:text-stone-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {/* The on/off slider switch */}
                                  <TaskToggleSlider
                                    checked={task.completed}
                                    onChange={(newChecked) => onToggleTask(evt.id, task.id, newChecked)}
                                    label={task.title}
                                  />
                                  <span className={`text-xs ${task.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-800 dark:text-stone-200 font-medium'} truncate`}>
                                    {task.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onDeleteTaskFromEvent(evt.id, task.id)}
                                    className="text-stone-300 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                                    title="Delete task"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-stone-400 italic py-1">
                            No tasks created yet for this activity.
                          </p>
                        )}

                        {/* Add individual task entry form */}
                        <div className="pt-1 flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Add new checklist task & press Enter..."
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
                            className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateTask(evt.id)}
                            disabled={!newTaskInputs[evt.id]?.trim()}
                            className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notes for Working this Day */}
      <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs space-y-2 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span>Notes</span>
          </span>
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={handleInsertBullet}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 bg-white dark:bg-[#282c34] px-2 py-0.5 rounded border border-[#e4ded5] dark:border-[#353943] cursor-pointer"
            >
              + Bullet (•)
            </button>
            <button
              type="button"
              onClick={handleInsertBreak}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 bg-white dark:bg-[#282c34] px-2 py-0.5 rounded border border-[#e4ded5] dark:border-[#353943] cursor-pointer"
            >
              + Break
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={dayNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Notes, customer feedback, parts used, pet care & reminders..."
          className="w-full text-xs p-3 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900 whitespace-pre-wrap font-sans leading-relaxed"
        />
      </div>

      {/* EDIT EVENT DETAILS MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#2d3139] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e4ded5] dark:border-[#2d3139]">
              <div className="flex items-center gap-2">
                <span className="text-xl">{editingEvent.emoji || '📅'}</span>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Edit Event Details
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {formatReadableDate(editingEvent.startDate)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['market', 'dinner_date', 'maintenance', 'pets', 'grocery_errand', 'other'] as EventCategory[]).map((cat) => {
                    const c = CATEGORY_CONFIG[cat];
                    const isSelected = editingEvent.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditingEvent({ ...editingEvent, category: cat })}
                        className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? `${c.badgeBg} ${c.borderColor} font-bold ring-1 ring-stone-900 dark:ring-stone-100`
                            : 'bg-white dark:bg-[#202329] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <span>{c.emoji}</span>
                        <span className="truncate text-[11px]">{c.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lead Person */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Lead / Assigned Person
                </label>
                <div className="flex items-center gap-2">
                  {(['both', 'her', 'him'] as Array<'both' | 'her' | 'him'>).map((lead) => (
                    <button
                      key={lead}
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, assignedTo: lead })}
                      className={`flex-1 py-1.5 rounded-lg border text-center transition-colors cursor-pointer ${
                        editingEvent.assignedTo === lead
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold border-transparent'
                          : 'bg-white dark:bg-[#202329] border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {lead === 'both' ? 'Both of Us' : lead === 'her' ? partner1Label : partner2Label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Start Time {editingEvent.startTime && <span className="font-mono font-normal text-stone-500 text-[11px]">({formatUsTime(editingEvent.startTime)})</span>}
                  </label>
                  <input
                    type="time"
                    value={editingEvent.startTime || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, startTime: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    End Time {editingEvent.endTime && <span className="font-mono font-normal text-stone-500 text-[11px]">({formatUsTime(editingEvent.endTime)})</span>}
                  </label>
                  <input
                    type="time"
                    value={editingEvent.endTime || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Location Name / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g., Waterfront Crafts Fair or His House"
                  value={editingEvent.locationName || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, locationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Market Pop-Up specific fields if category is market */}
              {editingEvent.category === 'market' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                  <span className="font-bold text-amber-950 dark:text-amber-200 block">
                    Pop-Up Market Financials & Stall Info
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-amber-800 dark:text-amber-300 mb-0.5">
                        Stall #
                      </label>
                      <input
                        type="text"
                        value={editingEvent.marketDetails?.boothNumber || ''}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            marketDetails: {
                              ...editingEvent.marketDetails,
                              boothNumber: e.target.value,
                              boothFee: editingEvent.marketDetails?.boothFee || 0,
                              targetRevenue: editingEvent.marketDetails?.targetRevenue || 0
                            }
                          })
                        }
                        className="w-full px-2 py-1 rounded bg-white dark:bg-[#202329] border border-amber-300 dark:border-amber-800 text-stone-900 dark:text-stone-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-amber-800 dark:text-amber-300 mb-0.5">
                        Stall Fee ($)
                      </label>
                      <input
                        type="number"
                        value={editingEvent.marketDetails?.boothFee || 0}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            marketDetails: {
                              ...editingEvent.marketDetails,
                              boothFee: Number(e.target.value),
                              targetRevenue: editingEvent.marketDetails?.targetRevenue || 0
                            }
                          })
                        }
                        className="w-full px-2 py-1 rounded bg-white dark:bg-[#202329] border border-amber-300 dark:border-amber-800 text-stone-900 dark:text-stone-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-amber-800 dark:text-amber-300 mb-0.5">
                        Target Sales ($)
                      </label>
                      <input
                        type="number"
                        value={editingEvent.marketDetails?.targetRevenue || 0}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            marketDetails: {
                              ...editingEvent.marketDetails,
                              boothFee: editingEvent.marketDetails?.boothFee || 0,
                              targetRevenue: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full px-2 py-1 rounded bg-white dark:bg-[#202329] border border-amber-300 dark:border-amber-800 text-stone-900 dark:text-stone-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notes & Checkpoints
                </label>
                <textarea
                  rows={3}
                  value={editingEvent.notes || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                  placeholder="Checkpoints, reservation codes, feeding instructions, tools needed..."
                  className="w-full p-2.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e4ded5] dark:border-[#2d3139]">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#252830] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Market Packout Modal */}
      {packoutEvent && (
        <MarketPackoutModal
          event={packoutEvent}
          isOpen={true}
          onClose={() => setPackoutEvent(null)}
          onSavePackout={handleSavePackout}
        />
      )}

      {/* Point of Sale Register Modal */}
      {posEvent && (
        <PointOfSaleRegisterModal
          event={posEvent}
          isOpen={true}
          onClose={() => setPosEvent(null)}
          onCompleteSale={handleCompleteSale}
        />
      )}

    </div>
  );
};
