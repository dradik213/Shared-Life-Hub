import React from 'react';
import { 
  Clock, 
  MapPin, 
  Home
} from 'lucide-react';
import { CalendarEvent, DayStayInfo, EventCategory, EventSortOption, SortDirection } from '../types/calendar';
import { CATEGORY_CONFIG, formatReadableDate, sortEventsForDay, formatTimeRange, matchesPartnerFilter } from '../utils/calendarUtils';
import { useAuth } from '../context/AuthContext';

interface AgendaViewProps {
  events: CalendarEvent[];
  stays: Record<string, DayStayInfo>;
  onSelectDate: (dateStr: string) => void;
  categoryFilter: EventCategory | 'all';
  partnerFilter: 'all' | 'her' | 'him';
  sortOption?: EventSortOption;
  sortDirection?: SortDirection;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  stays,
  onSelectDate,
  categoryFilter,
  partnerFilter,
  sortOption = 'time',
  sortDirection = 'none',
}) => {
  const { partner1Label, partner2Label, user1Theme, user2Theme } = useAuth();
  // Filter events
  const filteredEvents = events.filter((evt) => {
    if (categoryFilter !== 'all' && evt.category !== categoryFilter) return false;
    return matchesPartnerFilter(evt.assignedTo, partnerFilter);
  });

  // Group by date
  const grouped = filteredEvents.reduce<Record<string, CalendarEvent[]>>((acc, evt) => {
    if (!acc[evt.startDate]) acc[evt.startDate] = [];
    acc[evt.startDate].push(evt);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] shadow-2xs divide-y divide-[#e4ded5] dark:divide-[#2d3139] overflow-hidden transition-colors">
      <div className="p-3 bg-[#f5f1e8] dark:bg-[#202329] text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold flex items-center justify-between">
        <span>Chronological Shared Schedule</span>
        <span className="text-stone-400 dark:text-stone-500 font-normal">{filteredEvents.length} activities scheduled</span>
      </div>

      {sortedDates.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-xs">
          No activities match your current filter.
        </div>
      ) : (
        sortedDates.map((dateStr) => {
          const dayEvents = sortEventsForDay(grouped[dateStr], sortOption, sortDirection);
          const stayInfo = stays[dateStr];

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className="p-4 sm:p-5 transition-colors cursor-pointer hover:bg-[#f6f2ea] dark:hover:bg-[#22252b] flex flex-col sm:flex-row sm:items-start gap-4"
            >
              {/* Date Header Column */}
              <div className="sm:w-44 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {formatReadableDate(dateStr)}
                  </span>
                </div>

                {stayInfo && (
                  <div
                    title={`Stay: ${stayInfo.stayAt === 'our_home' ? 'Our Home' : stayInfo.stayAt === 'her_home' ? partner1Label : partner2Label}`}
                    className={`mt-1.5 inline-flex items-center justify-center p-1.5 rounded transition-colors shadow-2xs ${
                      stayInfo.stayAt === 'our_home'
                        ? 'bg-black text-white dark:bg-stone-900 dark:text-white border border-stone-800'
                        : stayInfo.stayAt === 'her_home'
                        ? user1Theme.badgeBg
                        : user2Theme.badgeBg
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Day Events Column with Subtle Category Colors */}
              <div className="flex-1 space-y-2.5">
                {dayEvents.map((evt) => {
                  const cfg = CATEGORY_CONFIG[evt.category];
                  const tasks = evt.tasks || [];
                  const completedTasks = tasks.filter((t) => t.completed).length;
                  const partnerLabel = evt.assignedTo === 'her' ? partner1Label : evt.assignedTo === 'him' ? partner2Label : 'Both';

                  return (
                    <div
                      key={evt.id}
                      className={`p-3 rounded-lg border transition-all shadow-2xs ${cfg.badgeBg} ${cfg.borderColor}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm leading-none shrink-0">{evt.emoji || cfg.emoji}</span>
                            <span className={`text-xs font-semibold ${cfg.textColor}`}>
                              {evt.title}
                            </span>
                            <span className="text-[11px] opacity-75">
                              · {cfg.shortLabel}
                            </span>
                            {tasks.length > 0 && (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded font-mono bg-white/60 dark:bg-black/30">
                                {completedTasks}/{tasks.length} tasks
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-80 mt-1 pl-5">
                            {evt.startTime && (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeRange(evt.startTime, evt.endTime)}</span>
                              </span>
                            )}
                            {evt.locationName && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{evt.locationName}</span>
                              </span>
                            )}
                          </div>

                          {evt.notes && (
                            <p className="text-xs mt-1.5 whitespace-pre-wrap font-sans bg-white/50 dark:bg-black/20 p-2 rounded">
                              {evt.notes}
                            </p>
                          )}

                          {evt.marketDetails && (
                            <div className="mt-2 flex items-center gap-3 text-xs bg-white/70 dark:bg-black/30 p-1.5 rounded border border-amber-300/60 font-mono">
                              <span>Fee: ${evt.marketDetails.boothFee}</span>
                              <span>·</span>
                              <span>Sales Goal: ${evt.marketDetails.targetRevenue}</span>
                            </div>
                          )}
                        </div>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${
                          evt.assignedTo === 'her'
                            ? user1Theme.badgeBg
                            : evt.assignedTo === 'him'
                            ? user2Theme.badgeBg
                            : 'bg-white/60 dark:bg-black/30 border-[#e4ded5] dark:border-[#353943] text-stone-700 dark:text-stone-300'
                        }`}>
                          {partnerLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
