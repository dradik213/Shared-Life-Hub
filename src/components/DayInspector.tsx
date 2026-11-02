import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Home, 
  Camera, 
  RotateCcw, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Trash2,
  Minimize2,
  X,
  Barcode,
  ShoppingBag,
  MapPin
} from 'lucide-react';
import { CalendarEvent, DayStayInfo, EventCategory, EventSortOption, EventTask, MarketPackoutItem, MarketSaleRecord, SortDirection, StayLocation } from '../types/calendar';
import { CATEGORY_CONFIG, formatReadableDate, sortEventsForDay, formatTimeRange, formatDateToYMD } from '../utils/calendarUtils';
import { TaskToggleSlider } from './TaskToggleSlider';
import { useAuth } from '../context/AuthContext';
import { GoogleTaskItem } from '../utils/googleWorkspace';
import { MarketPackoutModal } from './MarketPackoutModal';
import { PointOfSaleRegisterModal } from './PointOfSaleRegisterModal';

interface DayInspectorProps {
  selectedDate: string;
  events: CalendarEvent[];
  allEvents: CalendarEvent[];
  stayInfo?: DayStayInfo;
  googleTasks?: GoogleTaskItem[];
  onClose: () => void;
  onUpdateStay: (date: string, stay: StayLocation) => void;
  onUpdateStayNotes?: (date: string, notes: string) => void;
  onToggleTask: (eventId: string, taskId: string, completed: boolean) => void;
  onAddTaskToEvent: (eventId: string, taskTitle: string, assignedTo?: 'both' | 'him' | 'her') => void;
  onDeleteTaskFromEvent: (eventId: string, taskId: string) => void;
  onCopyTaskToDate: (sourceTaskTitle: string, targetDate: string, assignedTo?: 'both' | 'him' | 'her') => void;
  onUpdateEvent?: (updatedEvent: CalendarEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onOpenFridgePhotos: () => void;
  sortOption?: EventSortOption;
  sortDirection?: SortDirection;
  expandedEventIds?: Record<string, boolean>;
  expandedTaskSections?: Record<string, boolean>;
  onToggleExpandEvent?: (eventId: string) => void;
  onToggleExpandTasks?: (eventId: string) => void;
  onOpenDayView?: (dateStr: string) => void;
}

export const DayInspector: React.FC<DayInspectorProps> = ({
  selectedDate,
  events,
  allEvents,
  stayInfo,
  googleTasks = [],
  onClose,
  onUpdateStay,
  onUpdateStayNotes,
  onToggleTask,
  onAddTaskToEvent,
  onDeleteTaskFromEvent,
  onCopyTaskToDate,
  onUpdateEvent,
  onDeleteEvent,
  onOpenFridgePhotos,
  sortOption = 'time',
  sortDirection = 'none',
  expandedEventIds: propsExpandedEventIds,
  expandedTaskSections: propsExpandedTaskSections,
  onToggleExpandEvent,
  onToggleExpandTasks,
  onOpenDayView,
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
  const [showRolloverDrawer, setShowRolloverDrawer] = useState(false);
  const [dayNotes, setDayNotes] = useState(stayInfo?.notes || '');
  const [localExpandedEventIds, setLocalExpandedEventIds] = useState<Record<string, boolean>>({});
  const [localExpandedTaskSections, setLocalExpandedTaskSections] = useState<Record<string, boolean>>({});

  const currentExpandedEventIds = propsExpandedEventIds ?? localExpandedEventIds;
  const currentExpandedTaskSections = propsExpandedTaskSections ?? localExpandedTaskSections;

  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [packoutEvent, setPackoutEvent] = useState<CalendarEvent | null>(null);
  const [posEvent, setPosEvent] = useState<CalendarEvent | null>(null);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  const toggleEventExpanded = (eventId: string) => {
    if (onToggleExpandEvent) {
      onToggleExpandEvent(eventId);
    } else {
      setLocalExpandedEventIds((prev) => ({
        ...prev,
        [eventId]: !prev[eventId],
      }));
    }
  };

  const toggleTaskSection = (eventId: string) => {
    if (onToggleExpandTasks) {
      onToggleExpandTasks(eventId);
    } else {
      setLocalExpandedTaskSections((prev) => ({
        ...prev,
        [eventId]: !prev[eventId],
      }));
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

  // Fix: Sync dayNotes whenever selectedDate changes so notes don't stick to every day!
  useEffect(() => {
    setDayNotes(stayInfo?.notes || '');
  }, [selectedDate, stayInfo?.notes]);

  // Format date cleanly with separate day name and month/year heading
  const [y, m, d] = selectedDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const monthYearHeading = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
  const dateHeading = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

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

  // Day's events sorted by sortOption (supports multi-day spans)
  const activeDayEvents = (allEvents && allEvents.length > 0 ? allEvents : events).filter(
    (e) => e.startDate <= selectedDate && (e.endDate || e.startDate) >= selectedDate
  );
  const dayEvents = sortEventsForDay(activeDayEvents, sortOption, sortDirection);

  // Unified Backlog: Checklist tasks marked not completed from past dates + Google Tasks
  const TODAY_STR = formatDateToYMD(new Date());

  interface InspectorBacklogItem {
    id: string;
    title: string;
    sourceType: 'checklist' | 'google_task';
    sourceDetail: string;
    assignedTo?: 'both' | 'him' | 'her';
  }

  const allBacklogTasks: InspectorBacklogItem[] = [];

  allEvents.forEach((evt) => {
    // Only reference tasks whose originally assigned date has already passed
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

  // Overnight stay: 'her_home' | 'our_home' | 'his_home'
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

  return (
    <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] shadow-md overflow-hidden flex flex-col h-full transition-colors">
      
      {/* Header Bar - Single Clean Row: Stay Pill + Item Count on Left, Day View on Right */}
      <div className="px-3 py-2 border-b border-[#e4ded5] dark:border-[#2d3139] bg-[#f5f1e8] dark:bg-[#202329] flex items-center justify-between gap-2 flex-nowrap">
        <div className="min-w-0 flex items-center gap-2">
          {(() => {
            const dayPillStayColor = 
              currentStay === 'her_home'
                ? user1Theme.badgeBg
                : currentStay === 'his_home'
                ? user2Theme.badgeBg
                : currentStay === 'our_home'
                ? 'bg-stone-200/90 text-stone-700 dark:bg-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-600'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700';

            const [sy, sm, sd] = selectedDate.split('-').map(Number);
            const targetDateObj = new Date(sy, sm - 1, sd, 12, 0, 0);
            const shortDateLabel = targetDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            return (
              <button
                type="button"
                onClick={handleCycleStay}
                title={`Stay: ${currentStay === 'her_home' ? partner1Label : currentStay === 'his_home' ? partner2Label : `${partner1Label} & ${partner2Label}`} (Click to change stay)`}
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer shadow-2xs transition-all hover:opacity-90 active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${dayPillStayColor}`}
              >
                <Home className="w-3 h-3 shrink-0 opacity-80" />
                <span>{shortDateLabel}</span>
              </button>
            );
          })()}

          <span className="text-xs text-stone-500 dark:text-stone-400 truncate">
            {dayEvents.length} {dayEvents.length === 1 ? 'item' : 'items'}
          </span>

          {allBacklogTasks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRolloverDrawer(!showRolloverDrawer)}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200/80 hover:bg-stone-300/80 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer shrink-0"
              title="Toggle Backlog tasks to copy into this day"
            >
              + Backlog ({allBacklogTasks.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {onOpenDayView && (
            <button
              type="button"
              onClick={() => onOpenDayView(selectedDate)}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-[#e2ddd5] dark:border-[#353943] bg-white dark:bg-[#282c34] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#313640] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="Open full Daily Schedule"
            >
              Day View →
            </button>
          )}
        </div>
      </div>

      <div className="p-3 overflow-y-auto space-y-3 flex-1 pb-24">

        {/* Compact Backlog Inline List */}
        {showRolloverDrawer && allBacklogTasks.length > 0 && (
          <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#202329] p-2.5 shadow-2xs space-y-1.5 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-stone-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Backlog Tasks ({allBacklogTasks.length})
              </span>
              <button
                type="button"
                onClick={() => setShowRolloverDrawer(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {allBacklogTasks.map((item) => (
                <div
                  key={item.id}
                  className="p-1.5 rounded-lg bg-stone-50 dark:bg-[#282c35] border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="truncate flex-1 min-w-0">
                    <span className="font-medium text-stone-800 dark:text-stone-200 block truncate text-[11px]">
                      {item.title}
                    </span>
                    <span className="text-[9px] text-stone-500 dark:text-stone-400 block truncate">
                      {item.sourceDetail}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onCopyTaskToDate(item.title, selectedDate, item.assignedTo);
                    }}
                    className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-semibold px-2 py-0.5 rounded shadow-2xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer hover:bg-stone-800 dark:hover:bg-white"
                  >
                    <span>+ Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day Events & Individual Tasks List */}
        <div>
          {dayEvents.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-[#e4ded5] dark:border-[#353943] rounded-xl bg-[#f5f1e8]/30 dark:bg-[#1d2026]">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">No events scheduled for this day.</p>
              <p className="text-[11px] text-stone-400">Use the top right "Add" button to create an event.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((evt) => {
                const cfg = CATEGORY_CONFIG[evt.category];
                const tasks = evt.tasks || [];
                const completedCount = tasks.filter((t) => t.completed).length;

                // Formatted partner label
                const partnerLabel = evt.assignedTo === 'her' ? partner1Label : evt.assignedTo === 'him' ? partner2Label : 'K&D';
                const isExpanded = currentExpandedEventIds[evt.id] === true;
                const isTasksExpanded = currentExpandedTaskSections[evt.id] === true;
                const partner1Initial = partner1Label ? partner1Label[0].toUpperCase() : 'K';
                const partner2Initial = partner2Label ? partner2Label[0].toUpperCase() : 'D';
                const initialBadge = evt.assignedTo === 'her' ? partner1Initial : evt.assignedTo === 'him' ? partner2Initial : `${partner1Initial}&${partner2Initial}`;

                return (
                  <div
                    key={evt.id}
                    className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1a1d24] transition-all shadow-2xs overflow-hidden"
                  >
                    {/* Event Header: Row 1 = Full Untruncated Title with subtle category dot, Row 2 = Time + Partner on Left, Tasks + Chevron on Right */}
                    <div
                      onClick={() => toggleEventExpanded(evt.id)}
                      className="flex flex-col gap-1 py-2 px-3 cursor-pointer select-none hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
                    >
                      {/* Row 1: Full-width untruncated title with subtle category dot */}
                      <div className="w-full flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dotColor || 'bg-stone-400'}`} />
                        <h3 className="text-xs sm:text-sm font-semibold leading-snug break-words text-stone-900 dark:text-stone-100 flex-1">
                          {evt.title}
                        </h3>
                      </div>

                      {/* Row 2: Controls & secondary metadata */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        {/* Left: Time + Partner Badge */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          {evt.startTime && (
                            <span className="font-mono text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                              {formatTimeRange(evt.startTime, evt.endTime)}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                            evt.assignedTo === 'her'
                              ? user1Theme.badgeBg
                              : evt.assignedTo === 'him'
                              ? user2Theme.badgeBg
                              : 'bg-stone-200/80 dark:bg-stone-700/80 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600'
                          }`}>
                            {initialBadge}
                          </span>
                        </div>

                        {/* Right: Tasks Count Button + Expand Chevron */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {tasks.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskSection(evt.id);
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
                              toggleEventExpanded(evt.id);
                            }}
                            className="p-1.5 min-w-[28px] min-h-[28px] rounded-md bg-stone-100/70 hover:bg-stone-200/80 dark:bg-stone-800/60 dark:hover:bg-stone-700 border border-stone-200/70 dark:border-stone-700/70 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center cursor-pointer transition-colors"
                            title={isExpanded ? 'Collapse event details' : 'Expand event details'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 pt-0 space-y-2.5 border-t border-black/5 dark:border-white/5">
                        {/* Secondary metadata row: Category, Location, Delete */}
                        <div className="flex items-center justify-between gap-2 pt-2 text-xs flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] opacity-75 font-medium text-stone-600 dark:text-stone-300">
                              {cfg.shortLabel}
                            </span>
                            {evt.locationName && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                                <MapPin className="w-3 h-3 text-stone-400" />
                                <span>{evt.locationName}</span>
                              </span>
                            )}
                          </div>

                          {onDeleteEvent && (
                            confirmDeleteEventId === evt.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteEvent(evt.id);
                                    setConfirmDeleteEventId(null);
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  Confirm?
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteEventId(null);
                                  }}
                                  className="text-[10px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteEventId(evt.id);
                                }}
                                className="text-stone-300 dark:text-stone-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer"
                                title="Remove event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>

                        {/* Multiline Event Notes with line breaks & bullets preserved */}
                        {evt.notes && (
                          <div className="text-xs text-stone-700 dark:text-stone-300 bg-[#f7f4ec] dark:bg-[#252830] p-2.5 rounded-lg border border-[#e8e3d8] dark:border-[#353943] whitespace-pre-wrap break-words leading-relaxed font-sans">
                            {evt.notes}
                          </div>
                        )}

                        {/* Pop-Up Market Details & Inventory/Register Actions */}
                        {(evt.category === 'market' || evt.marketDetails) && (
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-2.5 space-y-2 text-xs font-mono">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-sans block">Booth Fee</span>
                                <span className="font-bold text-stone-900 dark:text-stone-100">${evt.marketDetails?.boothFee || 0}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-sans block">Actual Sales</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  ${(evt.marketDetails?.actualRevenue || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-amber-200/80 dark:border-amber-900/40">
                              <span className="text-[10px] text-amber-900 dark:text-amber-200 font-sans">
                                {evt.marketDetails?.inventory?.length 
                                  ? `${evt.marketDetails.inventory.reduce((a, b) => a + b.quantityPacked, 0)} items packed` 
                                  : '0 items packed'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPackoutEvent(evt)}
                                  className="px-2 py-1 rounded bg-white dark:bg-[#1a1d22] border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Barcode className="w-3 h-3 text-amber-700" />
                                  <span>Inventory</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPosEvent(evt)}
                                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Register</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Specific Event Individual Tasks Section */}
                    {(isTasksExpanded || (isExpanded && tasks.length === 0)) && (
                      <div className="p-3 pt-2 border-t border-[#f0ebe2] dark:border-[#2b2e36] space-y-2 bg-white/50 dark:bg-black/20">
                        {/* Individual Tasks List with Slider Switcher */}
                        {tasks.length > 0 ? (
                          <div className="space-y-1.5">
                            {tasks.map((task) => (
                              <div
                                key={task.id}
                                className="p-2 rounded-lg bg-[#fbf9f5] dark:bg-[#252830] border border-[#e8e3d8] dark:border-[#333742] flex items-center justify-between gap-2.5 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {/* The Slider on/off Switch */}
                                  <TaskToggleSlider
                                    checked={task.completed}
                                    onChange={(newChecked) => onToggleTask(evt.id, task.id, newChecked)}
                                    label={task.title}
                                  />
                                  <span
                                    className={`text-xs ${
                                      task.completed
                                        ? 'line-through text-stone-400 dark:text-stone-500'
                                        : 'text-stone-800 dark:text-stone-200'
                                    } truncate`}
                                  >
                                    {task.title}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onDeleteTaskFromEvent(evt.id, task.id)}
                                  className="text-stone-300 dark:text-stone-600 hover:text-rose-500 transition-colors p-0.5 shrink-0 cursor-pointer"
                                  title="Delete task"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-stone-400 italic py-1">
                            No tasks created yet for this activity.
                          </p>
                        )}

                        {/* Add Individual Task Text Box Entry Form */}
                        <div className="pt-1">
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
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 placeholder:text-stone-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes (Per-day, collapsible by default) */}
        <div className="border border-stone-200/80 dark:border-stone-800 rounded-xl bg-white dark:bg-[#1a1d24] overflow-hidden text-xs shadow-2xs">
          <div
            onClick={() => setIsNotesExpanded(!isNotesExpanded)}
            className="py-2 px-3 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50 dark:hover:bg-[#202329] transition-colors"
          >
            <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[11px]">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              Notes
            </span>
            <div className="flex-1 mx-2 truncate text-stone-400 text-[11px]">
              {dayNotes.trim() ? dayNotes.split('\n')[0] : 'Notes...'}
            </div>
            <div className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
              {isNotesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>

          {isNotesExpanded && (
            <div className="p-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-end gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleInsertBullet}
                  className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-white dark:bg-[#282c34] px-1.5 py-0.5 rounded border border-[#e4ded5] dark:border-[#353943] cursor-pointer"
                  title="Insert Bullet Point"
                >
                  + Bullet (•)
                </button>
                <button
                  type="button"
                  onClick={handleInsertBreak}
                  className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-white dark:bg-[#282c34] px-1.5 py-0.5 rounded border border-[#e4ded5] dark:border-[#353943] cursor-pointer"
                  title="Insert Line Break"
                >
                  + Break
                </button>
              </div>
              
              <textarea
                rows={3}
                value={dayNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add note..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 whitespace-pre-wrap font-sans leading-relaxed"
              />
            </div>
          )}
        </div>

      </div>

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
