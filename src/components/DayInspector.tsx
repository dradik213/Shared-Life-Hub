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
  ShoppingBag
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
  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});
  const [collapsedTaskSections, setCollapsedTaskSections] = useState<Record<string, boolean>>({});
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [packoutEvent, setPackoutEvent] = useState<CalendarEvent | null>(null);
  const [posEvent, setPosEvent] = useState<CalendarEvent | null>(null);

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEventIds((prev) => ({
      ...prev,
      [eventId]: prev[eventId] === undefined ? false : !prev[eventId],
    }));
  };

  const toggleTaskSection = (eventId: string) => {
    setCollapsedTaskSections((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
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

  // Format date cleanly without repeating day-of-week already shown in top bar
  const [y, m, d] = selectedDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
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
      
      {/* Header Bar - tight, streamlined spacing without redundant moon mention */}
      <div className="px-3.5 py-2.5 border-b border-[#e4ded5] dark:border-[#2d3139] bg-[#f5f1e8] dark:bg-[#202329] flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
              {dateHeading}
            </h2>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'} planned
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Photo Button: compact icon-only without redundant text */}
          <button
            type="button"
            onClick={onOpenFridgePhotos}
            className="relative p-1.5 rounded-lg bg-white dark:bg-[#282c34] hover:bg-stone-100 dark:hover:bg-[#313640] text-stone-700 dark:text-stone-200 border border-[#e2ddd5] dark:border-[#353943] shadow-2xs transition-colors cursor-pointer"
            title={`Fridge Photos${photoCount > 0 ? ` (${photoCount})` : ''}`}
            aria-label={`Fridge Photos${photoCount > 0 ? ` (${photoCount})` : ''}`}
          >
            <Camera className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            {photoCount > 0 && (
              <span className="absolute -top-1 -right-1 flex min-w-[14px] h-[14px] px-0.5 items-center justify-center rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[9px] font-bold shadow-xs">
                {photoCount}
              </span>
            )}
          </button>

          {/* Quick Collapse Button */}
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-[#2c3039] transition-colors cursor-pointer"
            title="Collapse Details & Expand Calendar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 overflow-y-auto space-y-3 flex-1">
        
        {/* Overnight Stay Selector with 3-position initials slider and center Home (compact, no redundant spacing) */}
        <div className="flex items-center justify-between bg-[#f5f1e8] dark:bg-[#202329] px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#2d3139] text-xs">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300 font-medium">
            <Home className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span className="text-[11px]">Stay:</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-[#ede8df]/70 dark:bg-[#1a1d22] px-2 py-0.5 rounded-md border border-[#e4ded5] dark:border-[#2d3139]">
            {/* Left Partner Initial */}
            <button
              type="button"
              onClick={() => onUpdateStay(selectedDate, currentStay === 'her_home' ? 'our_home' : 'her_home')}
              className={`w-5 h-5 flex items-center justify-center text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                currentStay === 'her_home'
                  ? `${user1Theme.activeText} ${user1Theme.activeBg} ring-1 ring-stone-400/40 dark:ring-stone-500/40 shadow-xs`
                  : `text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60`
              }`}
              title={`Stay at ${partner1DisplayName}'s (click again for Home)`}
              aria-label={`Stay at ${partner1DisplayName}'s`}
            >
              {partner1Initial}
            </button>

            {/* 3-Position Slider Switch: Left=Partner 1 Initial, Center=Home, Right=Partner 2 Initial */}
            <button
              type="button"
              role="switch"
              aria-label={`Overnight stay: ${currentStay === 'our_home' ? 'Home (Center)' : currentStay === 'her_home' ? partner1DisplayName : partner2DisplayName}`}
              onClick={handleCycleStay}
              className={`relative inline-flex h-5 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                currentStay === 'her_home'
                  ? user1Theme.sliderTrack
                  : currentStay === 'his_home'
                  ? user2Theme.sliderTrack
                  : 'bg-stone-700 dark:bg-stone-600 ring-1 ring-stone-500/50'
              }`}
              title={`Current Stay: ${currentStay === 'our_home' ? 'Home (Center)' : currentStay === 'her_home' ? partner1DisplayName : partner2DisplayName} (Click to cycle)`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ${
                  currentStay === 'her_home'
                    ? 'translate-x-0.5'
                    : currentStay === 'his_home'
                    ? 'translate-x-[30px]'
                    : 'translate-x-[16px] ring-1 ring-stone-400/50'
                }`}
              />
            </button>

            {/* Right Partner Initial */}
            <button
              type="button"
              onClick={() => onUpdateStay(selectedDate, currentStay === 'his_home' ? 'our_home' : 'his_home')}
              className={`w-5 h-5 flex items-center justify-center text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                currentStay === 'his_home'
                  ? `${user2Theme.activeText} ${user2Theme.activeBg} ring-1 ring-stone-400/40 dark:ring-stone-500/40 shadow-xs`
                  : `text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60`
              }`}
              title={`Stay at ${partner2DisplayName}'s (click again for Home)`}
              aria-label={`Stay at ${partner2DisplayName}'s`}
            >
              {partner2Initial}
            </button>
          </div>
        </div>

        {/* Unified Backlog Tasks Accordion: Google Tasks + Unfinished Checklist Items */}
        {allBacklogTasks.length > 0 && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowRolloverDrawer(!showRolloverDrawer)}
              className="w-full p-2.5 px-3 flex items-center justify-between text-left hover:bg-amber-100/40 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>{allBacklogTasks.length} Tasks in Backlog (Google Tasks & Unfinished Checklist)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                <span>{showRolloverDrawer ? 'Hide' : 'Review & Add'}</span>
                {showRolloverDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showRolloverDrawer && (
              <div className="p-3 border-t border-amber-200 dark:border-amber-900/50 bg-[#fffdfa] dark:bg-[#1e2127] space-y-2">
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Tasks from Google Tasks and past uncompleted checklist tags in your backlog:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {allBacklogTasks.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded bg-[#fcfaf7] dark:bg-[#252830] border border-[#e4ded5] dark:border-[#353943] flex items-center justify-between gap-2 text-xs"
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
                          <span className="font-medium text-stone-800 dark:text-stone-200 block truncate">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate mt-0.5">
                          {item.sourceDetail}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCopyTaskToDate(item.title, selectedDate, item.assignedTo)}
                        className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-semibold px-2 py-1 rounded shadow-2xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Day Events & Individual Tasks List */}
        <div>
          <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-[#e4ded5] dark:border-[#2d3139]">
            <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-mono">
              Events & Tasks ({dayEvents.length})
            </h3>

            {/* Colorful category counts summary */}
            <div className="flex items-center gap-1 flex-wrap">
              {Object.entries(
                dayEvents.reduce<Record<string, number>>((acc, e) => {
                  acc[e.category] = (acc[e.category] || 0) + 1;
                  return acc;
                }, {})
              ).map(([cat, count]) => {
                const meta = CATEGORY_CONFIG[cat as EventCategory];
                if (!meta) return null;
                return (
                  <span
                    key={cat}
                    title={`${count} ${meta.label}`}
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1 ${meta.badgeBg} ${meta.borderColor} ${meta.textColor}`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{count}</span>
                  </span>
                );
              })}
            </div>
          </div>

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
                const partnerLabel = evt.assignedTo === 'her' ? partner1Label : evt.assignedTo === 'him' ? partner2Label : 'Both';
                const eventEmoji = evt.emoji || cfg.emoji;
                const isExpanded = expandedEventIds[evt.id] !== false; // default open
                const isTasksCollapsed = collapsedTaskSections[evt.id] === true;

                return (
                  <div
                    key={evt.id}
                    className={`p-3.5 rounded-xl border border-l-4 transition-all shadow-2xs space-y-2.5 ${cfg.badgeBg} ${cfg.borderColor}`}
                  >
                    {/* Event Header with category colors */}
                    <div
                      onClick={() => toggleEventExpanded(evt.id)}
                      className="flex items-start justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm shrink-0 leading-none">{eventEmoji}</span>
                          <h4 className={`text-sm font-bold truncate ${cfg.textColor}`}>
                            {evt.title}
                          </h4>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            evt.assignedTo === 'her'
                              ? user1Theme.badgeBg
                              : evt.assignedTo === 'him'
                              ? user2Theme.badgeBg
                              : 'bg-white/80 dark:bg-black/40 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                          }`}>
                            {partnerLabel}
                          </span>
                          <span className="text-[10px] opacity-75 font-medium">
                            · {cfg.shortLabel}
                          </span>
                          {tasks.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskSection(evt.id);
                              }}
                              className="font-sans text-[10px] px-1.5 py-0.5 rounded bg-white/70 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 text-stone-700 dark:text-stone-300 font-mono inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title={isTasksCollapsed ? 'Expand checklist tasks' : 'Collapse checklist tasks'}
                            >
                              <span>{completedCount}/{tasks.length}</span>
                              {isTasksCollapsed ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
                            </button>
                          )}
                        </div>

                        {/* Event Time & Venue info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500 dark:text-stone-400 mt-0.5 pl-5">
                          {evt.startTime && (
                            <span className="font-mono text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeRange(evt.startTime, evt.endTime)}</span>
                            </span>
                          )}
                          {evt.locationName && (
                            <span className="truncate">
                              {evt.locationName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onDeleteEvent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteEvent(evt.id);
                            }}
                            className="text-stone-300 dark:text-stone-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer"
                            title="Remove event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventExpanded(evt.id);
                          }}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                          title={isExpanded ? 'Collapse event details' : 'Expand event details'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <>
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

                        {/* Specific Event Individual Tasks Section */}
                        <div className="pt-2 border-t border-[#f0ebe2] dark:border-[#2b2e36] space-y-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskSection(evt.id);
                            }}
                            className="w-full flex items-center justify-between text-xs cursor-pointer select-none group text-left"
                            title={isTasksCollapsed ? 'Expand checklist tasks' : 'Collapse checklist tasks'}
                          >
                            <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide flex items-center gap-1.5 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors">
                              <span>Checklist Tasks ({completedCount}/{tasks.length})</span>
                              {isTasksCollapsed ? (
                                <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-stone-600 transition-colors" />
                              ) : (
                                <ChevronUp className="w-3 h-3 text-stone-400 group-hover:text-stone-600 transition-colors" />
                              )}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {isTasksCollapsed ? 'Click to show tasks' : 'Toggle slider for status'}
                            </span>
                          </button>

                          {!isTasksCollapsed && (
                            <>
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
                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 placeholder:text-stone-400"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes (Per-day, syncs when selectedDate changes) */}
        <div className="border border-[#e4ded5] dark:border-[#2d3139] rounded-xl p-3.5 bg-[#f7f4ec]/80 dark:bg-[#1f2228] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
              Notes
            </span>
            <div className="flex items-center gap-1 text-[11px]">
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
          </div>
          
          <textarea
            rows={3}
            value={dayNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder={`Notes for ${dateHeading}...
• Record bullet notes or thoughts
• Auto-saved specifically for this day`}
            className="w-full text-xs p-2.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 whitespace-pre-wrap font-sans leading-relaxed"
          />
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
