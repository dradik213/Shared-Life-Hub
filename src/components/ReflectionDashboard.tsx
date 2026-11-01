import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Store, 
  Home, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Tag
} from 'lucide-react';
import { CalendarEvent, DayStayInfo } from '../types/calendar';
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
  const { partner1Label, partner2Label, partner1DisplayName, partner2DisplayName } = useAuth();
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
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
  const filteredEvents = events.filter((e) => {
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

  // Calculate individual checklist tasks metrics
  let totalTasksCount = 0;
  let completedTasksCount = 0;

  filteredEvents.forEach((evt) => {
    if (evt.tasks) {
      totalTasksCount += evt.tasks.length;
      completedTasksCount += evt.tasks.filter((t) => t.completed).length;
    }
  });

  const uncompletedTasksCount = totalTasksCount - completedTasksCount;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Pop-Up Markets summary (Target vs. Actual Revenue and Profits)
  const marketEvents = filteredEvents.filter((e) => e.category === 'market');
  const totalBoothFees = marketEvents.reduce((sum, e) => sum + (e.marketDetails?.boothFee || 0), 0);
  const totalTargetRevenue = marketEvents.reduce((sum, e) => sum + (e.marketDetails?.targetRevenue || 0), 0);
  const totalActualRevenue = marketEvents.reduce((sum, e) => sum + (e.marketDetails?.actualRevenue ?? 0), 0);
  const actualNetProfit = totalActualRevenue - totalBoothFees;
  const projectedNet = totalTargetRevenue - totalBoothFees;

  // Sales & Inventory Breakdown by Category & Price Tier across scheduled markets in timeframe
  const tierBreakdown = React.useMemo(() => {
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
          const curr = map.get(key)!;
          curr.unitsPacked += item.quantityPacked || 0;
          curr.unitsSold += item.quantitySold || 0;
          curr.revenue += (item.quantitySold || 0) * item.price;
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
            const curr = map.get(key)!;
            if (curr.unitsSold === 0) {
              curr.unitsSold += si.quantity;
              curr.revenue += si.quantity * price;
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

  // Stays breakdown
  const stayEntries = Object.values(stays).filter((s) => {
    if (timeframe === 'day') return s.date === selectedDate;
    if (timeframe === 'week') return s.date >= mondayStr && s.date <= sundayStr;
    if (timeframe === 'month') return s.date.startsWith(monthPrefix);
    return true;
  });
  const herNights = stayEntries.filter((s) => s.stayAt === 'her_home').length;
  const hisNights = stayEntries.filter((s) => s.stayAt === 'his_home').length;
  const homeNights = stayEntries.filter((s) => s.stayAt === 'our_home').length;
  const totalTrackedNights = herNights + hisNights + homeNights;
  const hisPercent = totalTrackedNights > 0 ? Math.round((hisNights / totalTrackedNights) * 100) : 0;
  const herPercent = totalTrackedNights > 0 ? Math.round((herNights / totalTrackedNights) * 100) : 0;
  const homePercent = Math.max(0, 100 - hisPercent - herPercent);

  // Notes from days & events
  const eventsWithNotes = filteredEvents.filter((e) => e.notes && e.notes.trim().length > 0);
  const staysWithNotes = stayEntries.filter((s) => s.notes && s.notes.trim().length > 0);

  // Unfinished individual tasks
  const incompleteTasks: Array<{
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
        if (!t.completed) {
          incompleteTasks.push({
            taskId: t.id,
            eventId: e.id,
            title: t.title,
            eventTitle: e.title,
            date: e.startDate,
            assignedTo: t.assignedTo || e.assignedTo,
            completed: t.completed,
          });
        }
      });
    }
  });

  const fetchAiReflection = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe,
          selectedDate,
          events: filteredEvents.map((e) => ({
            title: e.title,
            category: e.category,
            startDate: e.startDate,
            tasks: (e.tasks || []).length,
          })),
          stays: stayEntries.map((s) => ({
            date: s.date,
            stayAt: s.stayAt,
          })),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate AI reflection insights');
      }
      const data = await res.json();
      setAiInsights(data.insight || data.reflection || 'Reflection insights generated.');
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate AI reflection insights.');
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    fetchAiReflection();
  }, [timeframe, selectedDate]);

  return (
    <div className="space-y-5">
      {/* Timeframe Selector Bar: Daily / Weekly / Monthly / All Time */}
      <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold block">
            Couple Reflection & Performance Roll-Up
          </span>
          <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 mt-0.5">
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
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              timeframe === 'all'
                ? 'bg-white dark:bg-[#2e323c] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* AI Couple Reflection & Insights Banner */}
      {isAiLoading && (
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs flex items-center justify-center gap-3 text-xs text-stone-600 dark:text-stone-300">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Generating couple reflection & schedule insights...</span>
        </div>
      )}

      {aiError && (
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 p-4 text-xs flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{aiError}</span>
          </div>
          <button
            type="button"
            onClick={fetchAiReflection}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {aiInsights && !isAiLoading && !aiError && (
        <div className="bg-purple-50/70 dark:bg-purple-950/20 rounded-xl border border-purple-200/80 dark:border-purple-900/50 p-4 shadow-2xs text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Couple Reflection & Insights</span>
            </span>
            <button
              type="button"
              onClick={fetchAiReflection}
              className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
          <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans text-xs pt-1">
            {aiInsights}
          </p>
        </div>
      )}

      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Completed Individual Tasks */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-medium">Checklist Tasks Finished</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {completedTasksCount}
            </span>
            <span className="text-xs text-stone-400 font-mono">
              of {totalTasksCount} tasks ({taskCompletionRate}%)
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${taskCompletionRate}%` }}
            />
          </div>
        </div>

        {/* Incomplete Tasks Queue */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-medium">Unfinished Tasks Queue</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {uncompletedTasksCount}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Ready to roll forward
            </span>
          </div>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-2">
            Can be copied directly when planning upcoming days.
          </p>
        </div>

        {/* Pop-Up Market Financial Sum */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-medium">Market Performance</span>
            <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
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
          <div className="mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400">
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

        {/* House-to-House Nights */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-medium">House-to-House Nights</span>
            <Home className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {totalTrackedNights}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">nights tracked</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 flex items-center justify-between">
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {partner1DisplayName || 'Dustin'}: {hisNights}d ({hisPercent}%)
            </span>
            <span className="font-semibold text-purple-700 dark:text-purple-400">
              {partner2DisplayName || 'Katherine'}: {herNights}d ({herPercent}%)
            </span>
          </div>
          {/* Visual Two-Color Balance Bar */}
          <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 mt-2 overflow-hidden flex">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full transition-all"
              style={{ width: `${hisPercent}%` }}
              title={`${partner1DisplayName || 'Dustin'}: ${hisNights} nights`}
            />
            {homePercent > 0 && (
              <div
                className="bg-stone-500 h-full transition-all"
                style={{ width: `${homePercent}%` }}
                title={`Home / Joint: ${homeNights} nights`}
              />
            )}
            <div
              className="bg-purple-600 dark:bg-purple-500 h-full transition-all"
              style={{ width: `${herPercent}%` }}
              title={`${partner2DisplayName || 'Katherine'}: ${herNights} nights`}
            />
          </div>
          {homeNights > 0 && (
            <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
              Joint / Home: {homeNights}d
            </p>
          )}
        </div>

      </div>

      {/* Two Columns: Unfinished Tasks to Copy + Vendor Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Unfinished Individual Tasks */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e4ded5] dark:border-[#2d3139]">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                  Unfinished Tasks for this Period
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Items to roll forward into upcoming days
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                {incompleteTasks.length} tasks
              </span>
            </div>

            {incompleteTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">
                All scheduled tasks in this period were completed! 🎉
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {incompleteTasks.map((t) => (
                  <div
                    key={`${t.eventId}-${t.taskId}`}
                    className="p-3 rounded-lg border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#202329] flex items-center justify-between gap-3 text-xs"
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
        </div>

        {/* Pop-Up Market Details Breakdown */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e4ded5] dark:border-[#2d3139]">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Pop-Up Markets Roster & Cost Breakdown
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Stall fees, expected sales revenue, and booth performance
              </p>
            </div>
            <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="space-y-3">
            {marketEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                No markets scheduled during this timeframe.
              </div>
            ) : (
              marketEvents.map((market) => (
                <div
                  key={market.id}
                  className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {market.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {formatReadableDate(market.startDate)} · {market.locationName}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded">
                      {market.marketDetails?.boothNumber || 'Stall'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-amber-200 dark:border-amber-900/40 font-mono">
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] font-sans">Stall Fee</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        ${market.marketDetails?.boothFee || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] font-sans">Target Sales</span>
                      <span className="font-semibold text-amber-800 dark:text-amber-300">
                        ${market.marketDetails?.targetRevenue || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] font-sans">Net Target</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        +${(market.marketDetails?.targetRevenue || 0) - (market.marketDetails?.boothFee || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sales & Inventory Breakdown by Category & Price Tier */}
        <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e4ded5] dark:border-[#2d3139]">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Sales & Inventory Breakdown by Category & Price Tier</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Aggregated performance across markets grouped by Category and Unit Price
              </p>
            </div>
          </div>

          {tierBreakdown.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400">
              No packout inventory or sales recorded yet for markets in this timeframe. Pack items using "Log Inventory" on any market event.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {tierBreakdown.map((tier) => {
                  const remaining = Math.max(0, tier.unitsPacked - tier.unitsSold);
                  return (
                    <div
                      key={`${tier.category}-${tier.price}`}
                      className="p-3 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] shadow-2xs space-y-1.5"
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
            </div>
          )}
        </div>

      </div>

      {/* Day Notes & Reflections Stream with Multiline Bullets Preserved */}
      <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e4ded5] dark:border-[#2d3139]">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              Notes Log
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Notes, observations, and requests logged with line breaks & bullets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {eventsWithNotes.map((evt) => (
            <div key={evt.id} className="p-3.5 rounded-lg border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#202329]">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5 pb-1 border-b border-[#f0ece4] dark:border-[#2a2e36]">
                <span className="font-semibold text-stone-800 dark:text-stone-200">{evt.title}</span>
                <span className="font-mono text-[11px]">{formatReadableDate(evt.startDate)}</span>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words leading-relaxed font-sans">
                {evt.notes}
              </p>
            </div>
          ))}

          {staysWithNotes.map((stay) => (
            <div key={stay.date} className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20">
              <div className="flex items-center justify-between text-xs text-purple-900 dark:text-purple-300 mb-1.5 pb-1 border-b border-purple-200 dark:border-purple-900/40">
                <span className="font-semibold">Overnight @ {stay.label}</span>
                <span className="font-mono text-[11px]">{formatReadableDate(stay.date)}</span>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words leading-relaxed font-sans">
                {stay.notes}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
