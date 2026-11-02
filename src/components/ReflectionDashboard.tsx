import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Store, 
  Home, 
  FileText,
  ChevronDown, 
  ChevronUp,
  Tag,
  Package
} from 'lucide-react';
import { CalendarEvent, DayStayInfo, StayLocation } from '../types/calendar';
import { CATEGORY_CONFIG, formatReadableDate, formatDateToYMD } from '../utils/calendarUtils';
import { useAuth } from '../context/AuthContext';
import { TaskToggleSlider } from './TaskToggleSlider';

interface ReflectionDashboardProps {
  events: CalendarEvent[];
  stays: Record<string, DayStayInfo>;
  currentDate: Date;
  selectedDate: string;
  timeframe: 'day' | 'week' | 'month' | 'all';
  onTimeframeChange: (tf: 'day' | 'week' | 'month' | 'all') => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNavigateToDay: (dateStr: string) => void;
  onToggleTask?: (eventId: string, taskId: string, completed: boolean) => void;
}

export const ReflectionDashboard: React.FC<ReflectionDashboardProps> = ({
  events,
  stays,
  currentDate,
  selectedDate,
  timeframe,
  onTimeframeChange,
  onPrev,
  onNext,
  onToday,
  onNavigateToDay,
  onToggleTask,
}) => {
  const { partner1Label, partner2Label, partner1DisplayName, partner2DisplayName, user1Theme, user2Theme } = useAuth();

  // Collapsible state for each of the 6 Squares (all collapsed by default)
  const [expandedSquares, setExpandedSquares] = useState<Record<string, boolean>>({
    completedTasks: false,
    unfinishedTasks: false,
    marketPerformance: false,
    inventoryBreakdown: false,
    staysBalance: false,
    notesLog: false,
  });

  const toggleSquare = (id: string) => {
    setExpandedSquares((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Level 2 Nested Market Dropdowns
  const [expandedMarketIds, setExpandedMarketIds] = useState<Record<string, boolean>>({});
  const toggleMarket = (marketId: string) => {
    setExpandedMarketIds((prev) => ({
      ...prev,
      [marketId]: !prev[marketId],
    }));
  };

  // Level 2 Nested Note Dropdowns (Truncated by default)
  const [expandedNoteIds, setExpandedNoteIds] = useState<Record<string, boolean>>({});
  const toggleNote = (noteId: string) => {
    setExpandedNoteIds((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };

  // Compute start/end for week
  const curr = new Date(currentDate);
  const dayOfWeek = (curr.getDay() + 6) % 7;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - dayOfWeek);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = formatDateToYMD(monday);
  const sundayStr = formatDateToYMD(sunday);
  const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Filter events based on active timeframe (supporting multi-day spans)
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (timeframe === 'day') {
        return e.startDate <= selectedDate && (e.endDate || e.startDate) >= selectedDate;
      }
      if (timeframe === 'week') {
        return e.startDate <= sundayStr && (e.endDate || e.startDate) >= mondayStr;
      }
      if (timeframe === 'month') {
        return e.startDate.startsWith(monthPrefix) || (e.endDate && e.endDate.startsWith(monthPrefix));
      }
      return true; // 'all'
    });
  }, [events, timeframe, selectedDate, sundayStr, mondayStr, monthPrefix]);

  // Finished & Unfinished individual tasks
  const { completedTasks, incompleteTasks, totalTasksCount, completedTasksCount, uncompletedTasksCount, taskCompletionRate } = useMemo(() => {
    const finished: Array<{
      taskId: string;
      eventId: string;
      title: string;
      eventTitle: string;
      date: string;
      assignedTo?: string;
      completed: boolean;
    }> = [];

    const unfinished: Array<{
      taskId: string;
      eventId: string;
      title: string;
      eventTitle: string;
      date: string;
      assignedTo?: string;
      completed: boolean;
    }> = [];

    filteredEvents.forEach((e) => {
      if (e.tasks) {
        e.tasks.forEach((t) => {
          const item = {
            taskId: t.id,
            eventId: e.id,
            title: t.title,
            eventTitle: e.title,
            date: e.startDate,
            assignedTo: t.assignedTo || e.assignedTo,
            completed: t.completed,
          };
          if (t.completed) {
            finished.push(item);
          } else {
            unfinished.push(item);
          }
        });
      }
    });

    const total = finished.length + unfinished.length;
    const rate = total > 0 ? Math.round((finished.length / total) * 100) : 0;

    return {
      completedTasks: finished,
      incompleteTasks: unfinished,
      totalTasksCount: total,
      completedTasksCount: finished.length,
      uncompletedTasksCount: unfinished.length,
      taskCompletionRate: rate,
    };
  }, [filteredEvents]);

  // Pop-Up Markets summary (Target vs. Actual Revenue and Profits)
  const marketEvents = useMemo(() => filteredEvents.filter((e) => e.category === 'market'), [filteredEvents]);
  const totalBoothFees = useMemo(() => marketEvents.reduce((sum, e) => sum + (e.marketDetails?.boothFee || 0), 0), [marketEvents]);
  const totalTargetRevenue = useMemo(() => marketEvents.reduce((sum, e) => sum + (e.marketDetails?.targetRevenue || 0), 0), [marketEvents]);
  const totalActualRevenue = useMemo(() => marketEvents.reduce((sum, e) => sum + (e.marketDetails?.actualRevenue ?? 0), 0), [marketEvents]);
  const actualNetProfit = totalActualRevenue - totalBoothFees;

  // Sales & Inventory Breakdown by Category & Price Tier across scheduled markets in timeframe
  const tierBreakdown = useMemo(() => {
    interface TierAgg {
      category: string;
      price: number;
      unitsPacked: number;
      unitsSold: number;
      revenue: number;
    }
    const map = new Map<string, TierAgg>();

    marketEvents.forEach((m) => {
      // 1. Packout inventory
      if (m.marketDetails?.inventory) {
        m.marketDetails.inventory.forEach((item) => {
          const key = `${item.category}_${item.price.toFixed(2)}`;
          if (!map.has(key)) {
            map.set(key, {
              category: item.category,
              price: item.price,
              unitsPacked: 0,
              unitsSold: 0,
              revenue: 0,
            });
          }
          const currItem = map.get(key)!;
          currItem.unitsPacked += item.quantityPacked || 0;
          currItem.unitsSold += item.quantitySold || 0;
          currItem.revenue += (item.quantitySold || 0) * item.price;
        });
      }

      // 2. Sales records (if sales were logged with line items)
      if (m.marketDetails?.sales) {
        m.marketDetails.sales.forEach((s) => {
          s.items?.forEach((si) => {
            const cat = si.category || 'General';
            const price = si.unitPrice || 0;
            const key = `${cat}_${price.toFixed(2)}`;
            if (!map.has(key)) {
              map.set(key, {
                category: cat,
                price: price,
                unitsPacked: 0,
                unitsSold: 0,
                revenue: 0,
              });
            }
            const currItem = map.get(key)!;
            if (currItem.unitsSold === 0) {
              currItem.unitsSold += si.quantity;
              currItem.revenue += si.quantity * price;
            }
          });
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return b.price - a.price;
    });
    return list;
  }, [marketEvents]);

  const totalUnitsPacked = useMemo(() => tierBreakdown.reduce((sum, t) => sum + t.unitsPacked, 0), [tierBreakdown]);
  const totalUnitsSold = useMemo(() => tierBreakdown.reduce((sum, t) => sum + t.unitsSold, 0), [tierBreakdown]);
  const totalTierRevenue = useMemo(() => tierBreakdown.reduce((sum, t) => sum + t.revenue, 0), [tierBreakdown]);
  const totalUnitsRemaining = Math.max(0, totalUnitsPacked - totalUnitsSold);

  // Stays breakdown
  const stayEntries = useMemo(() => {
    return Object.values(stays).filter((s) => {
      if (timeframe === 'day') return s.date === selectedDate;
      if (timeframe === 'week') return s.date >= mondayStr && s.date <= sundayStr;
      if (timeframe === 'month') return s.date.startsWith(monthPrefix);
      return true;
    });
  }, [stays, timeframe, selectedDate, mondayStr, sundayStr, monthPrefix]);

  const sortedStayEntries = useMemo(() => {
    return [...stayEntries].sort((a, b) => a.date.localeCompare(b.date));
  }, [stayEntries]);

  const herNights = stayEntries.filter((s) => s.stayAt === 'her_home').length;
  const hisNights = stayEntries.filter((s) => s.stayAt === 'his_home').length;
  const homeNights = stayEntries.filter((s) => s.stayAt === 'our_home').length;
  const totalTrackedNights = herNights + hisNights + homeNights;
  const hisPercent = totalTrackedNights > 0 ? Math.round((hisNights / totalTrackedNights) * 100) : 0;
  const herPercent = totalTrackedNights > 0 ? Math.round((herNights / totalTrackedNights) * 100) : 0;
  const homePercent = Math.max(0, 100 - hisPercent - herPercent);

  // Notes from days & events
  const eventsWithNotes = useMemo(() => filteredEvents.filter((e) => e.notes && e.notes.trim().length > 0), [filteredEvents]);
  const staysWithNotes = useMemo(() => stayEntries.filter((s) => s.notes && s.notes.trim().length > 0), [stayEntries]);

  return (
    <div className="space-y-4">
      {/* Timeframe Selector Bar: Daily / Weekly / Monthly / All Time */}
      <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-3.5 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3.5 transition-colors">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold block">
            Couple Reflection & Performance Roll-Up
          </span>
          <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            {timeframe === 'day'
              ? `Daily: ${formatReadableDate(selectedDate)}`
              : timeframe === 'week'
              ? `Weekly: ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : timeframe === 'month'
              ? `Monthly: ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
              : 'All Time: Couple Performance'}
          </h2>
        </div>

        {/* Dynamic Timeframe Selector matching user request (Daily / Weekly / Monthly / All Time) */}
        <div className="flex items-center bg-stone-200/60 dark:bg-[#24272f] p-0.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300">
          <button
            type="button"
            onClick={() => onTimeframeChange('day')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              timeframe === 'day'
                ? 'bg-white dark:bg-[#2e323c] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => onTimeframeChange('week')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              timeframe === 'week'
                ? 'bg-white dark:bg-[#2e323c] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => onTimeframeChange('month')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              timeframe === 'month'
                ? 'bg-white dark:bg-[#2e323c] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => onTimeframeChange('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              timeframe === 'all'
                ? 'bg-white dark:bg-[#2e323c] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* 6 Self-Contained Collapsible Metric Squares */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        
        {/* SQUARE 1: Checklist Tasks Finished */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs transition-colors">
          <div 
            onClick={() => toggleSquare('completedTasks')}
            className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-stone-800 dark:text-stone-200">Checklist Tasks Finished</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSquare('completedTasks');
              }}
              className="p-1.5 min-w-[28px] min-h-[28px] rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title={expandedSquares.completedTasks ? 'Collapse finished tasks' : 'Expand finished tasks'}
              aria-label="Toggle completed tasks list"
            >
              {expandedSquares.completedTasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div 
            onClick={() => toggleSquare('completedTasks')}
            className="cursor-pointer"
          >
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                {completedTasksCount}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                of {totalTasksCount} tasks ({taskCompletionRate}%)
              </span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${taskCompletionRate}%` }}
              />
            </div>
          </div>

          {/* Collapsible Finished Tasks Dropdown Body */}
          {expandedSquares.completedTasks && (
            <div className="mt-3.5 pt-3.5 border-t border-[#e4ded5] dark:border-[#2d3139]">
              {completedTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  No completed tasks in this period.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
                  {completedTasks.map((t) => (
                    <div
                      key={`${t.eventId}-${t.taskId}`}
                      className="p-2.5 rounded-lg border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-stone-800 dark:text-stone-200 line-through opacity-85 truncate">
                          {t.title}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 truncate">
                          {t.eventTitle} · {formatReadableDate(t.date)}
                        </div>
                      </div>
                      {onToggleTask && (
                        <div className="shrink-0">
                          <TaskToggleSlider
                            checked={t.completed}
                            onChange={(val) => onToggleTask(t.eventId, t.taskId, val)}
                            label={t.title}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SQUARE 2: Unfinished Tasks Queue */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs transition-colors">
          <div 
            onClick={() => toggleSquare('unfinishedTasks')}
            className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-stone-800 dark:text-stone-200">Unfinished Tasks Queue</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSquare('unfinishedTasks');
              }}
              className="p-1.5 min-w-[28px] min-h-[28px] rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title={expandedSquares.unfinishedTasks ? 'Collapse unfinished tasks' : 'Expand unfinished tasks'}
              aria-label="Toggle unfinished tasks list"
            >
              {expandedSquares.unfinishedTasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div 
            onClick={() => toggleSquare('unfinishedTasks')}
            className="cursor-pointer"
          >
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                {uncompletedTasksCount}
              </span>
            </div>
          </div>

          {/* Collapsible Unfinished Tasks Dropdown Body */}
          {expandedSquares.unfinishedTasks && (
            <div className="mt-3.5 pt-3.5 border-t border-[#e4ded5] dark:border-[#2d3139]">
              {incompleteTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  All scheduled tasks in this period were completed! 🎉
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
                  {incompleteTasks.map((t) => (
                    <div
                      key={`${t.eventId}-${t.taskId}`}
                      className="p-2.5 rounded-lg border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#202329] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-stone-800 dark:text-stone-200 truncate">
                          {t.title}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 truncate">
                          {t.eventTitle} · {formatReadableDate(t.date)}
                        </div>
                      </div>
                      {onToggleTask && (
                        <div className="shrink-0">
                          <TaskToggleSlider
                            checked={t.completed}
                            onChange={(val) => onToggleTask(t.eventId, t.taskId, val)}
                            label={t.title}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SQUARE 3: Market Performance (With Nested Level 2 Dropdowns Per Market) */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs transition-colors">
          <div 
            onClick={() => toggleSquare('marketPerformance')}
            className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-stone-800 dark:text-stone-200">Market Performance</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSquare('marketPerformance');
              }}
              className="p-1.5 min-w-[28px] min-h-[28px] rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title={expandedSquares.marketPerformance ? 'Collapse market breakdown' : 'Expand market breakdown'}
              aria-label="Toggle market breakdown"
            >
              {expandedSquares.marketPerformance ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div 
            onClick={() => toggleSquare('marketPerformance')}
            className="cursor-pointer"
          >
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                ${totalActualRevenue}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Actual Gross ({marketEvents.length} mkts)
              </span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 flex items-center justify-between">
              <span>Fees: ${totalBoothFees}</span>
              <span className={`font-semibold ${actualNetProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                Net Profit: ${actualNetProfit >= 0 ? `+${actualNetProfit}` : actualNetProfit}
              </span>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400">
              <span>Target: ${totalTargetRevenue}</span>
              <span className="font-mono font-semibold">
                {totalTargetRevenue > 0 ? `${Math.round((totalActualRevenue / totalTargetRevenue) * 100)}%` : '0%'} achieved
              </span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-amber-500 dark:bg-yellow-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, totalTargetRevenue > 0 ? Math.round((totalActualRevenue / totalTargetRevenue) * 100) : 0)}%` }}
              />
            </div>
          </div>

          {/* Level 1 Dropdown: Individual Market Cards with Nested Level 2 Item Breakdowns */}
          {expandedSquares.marketPerformance && (
            <div className="mt-3.5 pt-3.5 border-t border-[#e4ded5] dark:border-[#2d3139]">
              {marketEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  No markets scheduled during this timeframe.
                </div>
              ) : (
                <div className="max-h-[440px] overflow-y-auto pr-1 space-y-3">
                  {marketEvents.map((market) => {
                    const isMktExpanded = !!expandedMarketIds[market.id];
                    const boothFee = market.marketDetails?.boothFee || 0;
                    const targetRevenue = market.marketDetails?.targetRevenue || 0;
                    const actualRevenue = market.marketDetails?.actualRevenue ?? 0;
                    const netProfit = (actualRevenue || targetRevenue) - boothFee;
                    const inventoryItems = market.marketDetails?.inventory || [];

                    return (
                      <div
                        key={market.id}
                        className="p-3 rounded-xl border border-amber-200/90 dark:border-amber-900/50 bg-white dark:bg-[#202329] space-y-2 shadow-2xs"
                      >
                        {/* Market Level Header with Level 2 Arrow */}
                        <div 
                          onClick={() => toggleMarket(market.id)}
                          className="flex items-start justify-between gap-2 cursor-pointer select-none"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              {market.title}
                            </h4>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                              {formatReadableDate(market.startDate)} · {market.locationName}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded">
                              {market.marketDetails?.boothNumber || 'Stall'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMarket(market.id);
                              }}
                              className="p-1 min-w-[24px] min-h-[24px] rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                              title={isMktExpanded ? 'Collapse inventory breakdown' : 'Expand inventory breakdown'}
                            >
                              {isMktExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Market Financial Row */}
                        <div className="grid grid-cols-4 gap-1 text-[11px] pt-1 border-t border-stone-100 dark:border-stone-800 font-mono">
                          <div>
                            <span className="text-stone-400 block text-[9px] font-sans">Fee</span>
                            <span className="font-semibold text-stone-700 dark:text-stone-300">${boothFee}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[9px] font-sans">Target</span>
                            <span className="font-semibold text-amber-700 dark:text-amber-400">${targetRevenue}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[9px] font-sans">Actual</span>
                            <span className="font-semibold text-stone-900 dark:text-stone-100">${actualRevenue}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[9px] font-sans">Net Profit</span>
                            <span className={`font-semibold ${netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
                              {netProfit >= 0 ? `+${netProfit}` : netProfit}
                            </span>
                          </div>
                        </div>

                        {/* Level 2 Nested Dropdown: Item-by-item Inventory & Sales Breakdown */}
                        {isMktExpanded && (
                          <div className="pt-2 mt-1 border-t border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                              Inventory & Sales for this Market:
                            </span>
                            {inventoryItems.length === 0 ? (
                              <p className="text-[11px] text-stone-400 dark:text-stone-500 py-1 italic">
                                No item-by-item inventory logged for this market.
                              </p>
                            ) : (
                              inventoryItems.map((item, idx) => {
                                const remaining = Math.max(0, item.quantityPacked - (item.quantitySold || 0));
                                const itemRev = ((item.quantitySold || 0) * item.price).toFixed(2);
                                return (
                                  <div
                                    key={idx}
                                    className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <span className="font-semibold text-stone-800 dark:text-stone-200 block truncate text-[11px]">
                                        {item.category} — ${item.price.toFixed(2)}
                                      </span>
                                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                                        {item.quantityPacked} packed • {remaining} remaining
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0 font-mono">
                                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                                        ${itemRev}
                                      </span>
                                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                                        {item.quantitySold || 0} sold
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SQUARE 4: Sales & Inventory Breakdown (Dedicated Square for Aggregated Inventory & Sales) */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs transition-colors">
          <div 
            onClick={() => toggleSquare('inventoryBreakdown')}
            className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-stone-800 dark:text-stone-200">Sales & Inventory Breakdown</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSquare('inventoryBreakdown');
              }}
              className="p-1.5 min-w-[28px] min-h-[28px] rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title={expandedSquares.inventoryBreakdown ? 'Collapse inventory breakdown' : 'Expand inventory breakdown'}
              aria-label="Toggle inventory breakdown"
            >
              {expandedSquares.inventoryBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div 
            onClick={() => toggleSquare('inventoryBreakdown')}
            className="cursor-pointer"
          >
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                ${totalTierRevenue.toFixed(2)}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Gross ({tierBreakdown.length} tiers)
              </span>
            </div>
            <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-2 flex items-center justify-between">
              <span><strong>{totalUnitsSold}</strong> units sold</span>
              <span>•</span>
              <span>{totalUnitsPacked} packed ({totalUnitsRemaining} left)</span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-amber-600 dark:bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${totalUnitsPacked > 0 ? Math.round((totalUnitsSold / totalUnitsPacked) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Collapsible Aggregated Category & Price Tier Breakdown */}
          {expandedSquares.inventoryBreakdown && (
            <div className="mt-3.5 pt-3.5 border-t border-[#e4ded5] dark:border-[#2d3139]">
              {tierBreakdown.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  No packout inventory or sales recorded yet for markets in this timeframe.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
                  {tierBreakdown.map((tier) => {
                    const remaining = Math.max(0, tier.unitsPacked - tier.unitsSold);
                    return (
                      <div
                        key={`${tier.category}-${tier.price}`}
                        className="p-2.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {tier.category} — ${tier.price.toFixed(2)}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${tier.revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-stone-600 dark:text-stone-400 flex items-center justify-between">
                          <span><strong>{tier.unitsSold}</strong> sold</span>
                          <span>•</span>
                          <span>{tier.unitsPacked} packed ({remaining} remaining)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SQUARE 5: Overnight Stays Balance */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs transition-colors">
          <div 
            onClick={() => toggleSquare('staysBalance')}
            className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="font-semibold text-stone-800 dark:text-stone-200">Overnight Stays Balance</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSquare('staysBalance');
              }}
              className="p-1.5 min-w-[28px] min-h-[28px] rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title={expandedSquares.staysBalance ? 'Collapse stays list' : 'Expand stays list'}
              aria-label="Toggle stays balance list"
            >
              {expandedSquares.staysBalance ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div 
            onClick={() => toggleSquare('staysBalance')}
            className="cursor-pointer"
          >
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                {totalTrackedNights}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">nights tracked</span>
            </div>
            <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-2 flex items-center justify-between flex-wrap gap-1">
              <span className="font-semibold text-purple-700 dark:text-purple-400">
                {partner1Label}: {herNights}d ({herPercent}%)
              </span>
              <span className="font-semibold text-stone-600 dark:text-stone-400">
                Own Home: {homeNights}d ({homePercent}%)
              </span>
              <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                {partner2Label}: {hisNights}d ({hisPercent}%)
              </span>
            </div>
            {/* Visual Three-Color Balance Bar */}
            <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 mt-2 overflow-hidden flex">
              <div
                className="bg-purple-600 dark:bg-purple-500 h-full transition-all"
                style={{ width: `${herPercent}%` }}
                title={`${partner1Label}: ${herNights} nights`}
              />
              {homePercent > 0 && (
                <div
                  className="bg-stone-400 dark:bg-stone-500 h-full transition-all"
                  style={{ width: `${homePercent}%` }}
                  title={`Own Home: ${homeNights} nights`}
                />
              )}
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all"
                style={{ width: `${hisPercent}%` }}
                title={`${partner2Label}: ${hisNights} nights`}
              />
            </div>
          </div>

          {/* Collapsible Overnight Stays Roster */}
          {expandedSquares.staysBalance && (
            <div className="mt-3.5 pt-3.5 border-t border-[#e4ded5] dark:border-[#2d3139]">
              {sortedStayEntries.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  No stays tracked in this period.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-1 space-y-1.5">
                  {sortedStayEntries.map((stay) => {
                    const badgeBg = stay.stayAt === 'his_home' 
                      ? user2Theme.badgeBg 
                      : stay.stayAt === 'her_home' 
                      ? user1Theme.badgeBg 
                      : 'bg-stone-200/90 text-stone-700 dark:bg-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-600';
                    const label = stay.stayAt === 'his_home' 
                      ? `${partner2Label}'s Place` 
                      : stay.stayAt === 'her_home' 
                      ? `${partner1Label}'s Place` 
                      : 'Our Own Home';

                    return (
                      <div
                        key={stay.date}
                        className="p-2 rounded-lg border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#202329] flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-stone-700 dark:text-stone-300 font-medium">
                          {formatReadableDate(stay.date)}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeBg}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SQUARE 6: Notes & Activity Log (With Nested Expandable Truncated Notes) */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs transition-colors">
          <div 
            onClick={() => toggleSquare('notesLog')}
            className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-600 dark:text-stone-400 shrink-0" />
              <span className="font-semibold text-stone-800 dark:text-stone-200">Notes & Activity Log</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSquare('notesLog');
              }}
              className="p-1.5 min-w-[28px] min-h-[28px] rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title={expandedSquares.notesLog ? 'Collapse notes' : 'Expand notes log'}
              aria-label="Toggle notes log"
            >
              {expandedSquares.notesLog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div 
            onClick={() => toggleSquare('notesLog')}
            className="cursor-pointer"
          >
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                {eventsWithNotes.length + staysWithNotes.length}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">notes recorded</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2">
              {eventsWithNotes.length} event notes • {staysWithNotes.length} stay notes
            </p>
          </div>

          {/* Level 1 Dropdown: Notes List with Level 2 Expandable Truncated Cards */}
          {expandedSquares.notesLog && (
            <div className="mt-3.5 pt-3.5 border-t border-[#e4ded5] dark:border-[#2d3139]">
              {eventsWithNotes.length === 0 && staysWithNotes.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  No notes recorded during this timeframe.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2.5">
                  {/* Event Notes */}
                  {eventsWithNotes.map((evt) => {
                    const noteKey = `evt-${evt.id}`;
                    const isNoteExpanded = !!expandedNoteIds[noteKey];

                    return (
                      <div
                        key={evt.id}
                        className="p-2.5 rounded-lg border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#202329] space-y-1"
                      >
                        <div 
                          onClick={() => toggleNote(noteKey)}
                          className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none"
                        >
                          <span className="font-semibold text-stone-800 dark:text-stone-200 truncate pr-2">
                            {evt.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-[10px]">{formatReadableDate(evt.startDate)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNote(noteKey);
                              }}
                              className="p-1 min-w-[22px] min-h-[22px] rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                              title={isNoteExpanded ? 'Collapse note' : 'Expand full note'}
                            >
                              {isNoteExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Note Body (1-line truncated preview vs full multi-line text) */}
                        {isNoteExpanded ? (
                          <p className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words leading-relaxed font-sans pt-1">
                            {evt.notes}
                          </p>
                        ) : (
                          <p 
                            onClick={() => toggleNote(noteKey)}
                            className="text-xs text-stone-600 dark:text-stone-400 truncate line-clamp-1 cursor-pointer"
                          >
                            {evt.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Overnight Stay Notes */}
                  {staysWithNotes.map((stay) => {
                    const noteKey = `stay-${stay.date}`;
                    const isNoteExpanded = !!expandedNoteIds[noteKey];

                    return (
                      <div
                        key={stay.date}
                        className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-1"
                      >
                        <div 
                          onClick={() => toggleNote(noteKey)}
                          className="flex items-center justify-between text-xs text-purple-900 dark:text-purple-300 cursor-pointer select-none"
                        >
                          <span className="font-semibold truncate pr-2">
                            Overnight @ {stay.label || (stay.stayAt === 'his_home' ? partner1DisplayName : stay.stayAt === 'her_home' ? partner2DisplayName : 'Home')}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-[10px]">{formatReadableDate(stay.date)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNote(noteKey);
                              }}
                              className="p-1 min-w-[22px] min-h-[22px] rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                              title={isNoteExpanded ? 'Collapse note' : 'Expand full note'}
                            >
                              {isNoteExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Stay Note Body (1-line truncated preview vs full multi-line text) */}
                        {isNoteExpanded ? (
                          <p className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words leading-relaxed font-sans pt-1">
                            {stay.notes}
                          </p>
                        ) : (
                          <p 
                            onClick={() => toggleNote(noteKey)}
                            className="text-xs text-stone-600 dark:text-stone-400 truncate line-clamp-1 cursor-pointer"
                          >
                            {stay.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
