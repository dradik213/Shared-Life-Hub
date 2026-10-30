import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  CloudSun, 
  Sunset, 
  Moon, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Sparkles, 
  Clock, 
  Calendar as CalendarIcon, 
  Home, 
  ChevronDown, 
  ChevronUp, 
  Quote, 
  MapPin, 
  Heart,
  RefreshCw,
  Search,
  Check,
  Cloud,
  CloudLightning,
  CloudSnow,
  CloudDrizzle,
  CloudFog,
  X
} from 'lucide-react';
import { CalendarEvent, DayStayInfo, EventCategory } from '../types/calendar';
import { CATEGORY_CONFIG, formatReadableDate, formatDateToYMD, formatUsTime } from '../utils/calendarUtils';
import { getMoonPhase, getDailyInspiration, MoonPhaseInfo } from '../utils/astronomyUtils';
import { useAuth } from '../context/AuthContext';
import { 
  WeatherLocation, 
  LiveWeatherReport, 
  DayForecastData, 
  getSavedLocation, 
  saveLocation, 
  fetchLiveForecast, 
  searchLocations,
  DEFAULT_LOCATION 
} from '../services/liveWeatherService';

interface SelectedDaySummaryWidgetProps {
  selectedDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  stays: Record<string, DayStayInfo>;
  onFilterCategory?: (cat: EventCategory | 'all') => void;
  categoryFilter?: EventCategory | 'all';
}

const COLLAPSED_STORAGE_KEY = 'duosync_day_widget_collapsed';

export const SelectedDaySummaryWidget: React.FC<SelectedDaySummaryWidgetProps> = ({
  selectedDate,
  events,
  stays,
  onFilterCategory,
  categoryFilter,
}) => {
  const { 
    currentUser, 
    partnerUser, 
    coupleViewLabel, 
    partner1Label, 
    partner2Label, 
    partner1Initial, 
    partner2Initial, 
    partner1DisplayName, 
    partner2DisplayName, 
    user1Theme, 
    user2Theme 
  } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F');
  const [currentLocation, setCurrentLocation] = useState<WeatherLocation>(getSavedLocation);
  const [weatherReport, setWeatherReport] = useState<LiveWeatherReport | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Location search modal / popover state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WeatherLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(isCollapsed));
    } catch (e) {}
  }, [isCollapsed]);

  // Load weather report on mount and when location changes
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      setIsLoadingWeather(true);
      setWeatherError(null);
      try {
        const report = await fetchLiveForecast(currentLocation);
        if (isMounted) {
          setWeatherReport(report);
        }
      } catch (err: any) {
        if (isMounted) {
          setWeatherError('Unable to sync live radar. Check internet connection.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingWeather(false);
        }
      }
    };

    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [currentLocation]);

  const handleRefreshWeather = async () => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const report = await fetchLiveForecast(currentLocation, true);
      setWeatherReport(report);
    } catch (err: any) {
      setWeatherError('Failed to refresh radar.');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleUseGpsLocation = () => {
    if (!navigator.geolocation) {
      setWeatherError('Geolocation not supported by browser.');
      return;
    }
    setIsLoadingWeather(true);
    setWeatherError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLoc: WeatherLocation = {
          name: 'My GPS Location',
          latitude,
          longitude,
        };
        setCurrentLocation(newLoc);
        saveLocation(newLoc);
        setShowLocationModal(false);
      },
      (err) => {
        setIsLoadingWeather(false);
        setWeatherError('Location access was denied.');
      },
      { timeout: 8000 }
    );
  };

  const handleSearchLocations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('No matching locations found.');
      }
    } catch (err) {
      setSearchError('Search failed. Try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (loc: WeatherLocation) => {
    setCurrentLocation(loc);
    saveLocation(loc);
    setShowLocationModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Parse selected date into Date object (local timezone)
  const [year, month, day] = selectedDate.split('-').map(Number);
  const parsedDate = new Date(year, (month || 1) - 1, day || 1, 12, 0, 0);

  // Check if selectedDate is today
  const todayStr = formatDateToYMD(new Date());
  const isToday = selectedDate === todayStr;

  // Astronomical & Inspiration calculations
  const moon: MoonPhaseInfo = getMoonPhase(parsedDate);
  const inspiration = getDailyInspiration(parsedDate);

  // Look up real weather for selectedDate from the Open-Meteo forecast report
  const dayForecast: DayForecastData | undefined = weatherReport?.days[selectedDate];

  // Calculate day difference from today
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const targetDateOnly = new Date(year, (month || 1) - 1, day || 1);
  const diffDays = Math.round((targetDateOnly.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  const isWithinHorizon = dayForecast != null && diffDays >= 0 && diffDays <= 14;

  // Filter events for selected day (supporting multi-day spans)
  const dayEvents = events.filter((e) => e.startDate <= selectedDate && (e.endDate || e.startDate) >= selectedDate);
  const stayInfo = stays[selectedDate];

  // Group events by category & calculate time spent
  let totalScheduledMinutes = 0;
  const categoryStats: Record<string, { count: number; minutes: number }> = {
    market: { count: 0, minutes: 0 },
    dinner_date: { count: 0, minutes: 0 },
    maintenance: { count: 0, minutes: 0 },
    pets: { count: 0, minutes: 0 },
    grocery_errand: { count: 0, minutes: 0 },
    other: { count: 0, minutes: 0 },
  };

  dayEvents.forEach((evt) => {
    let durationMins = 60; // default 1 hour if not specified
    if (evt.startTime && evt.endTime) {
      const [sh, sm] = evt.startTime.split(':').map(Number);
      const [eh, em] = evt.endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh)) {
        const diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
        if (diff > 0) durationMins = diff;
      }
    } else if (evt.startTime && !evt.endTime) {
      durationMins = 60;
    }

    totalScheduledMinutes += durationMins;

    const catKey = evt.category in categoryStats ? evt.category : 'other';
    categoryStats[catKey].count += 1;
    categoryStats[catKey].minutes += durationMins;
  });

  // Calculate free time during active waking day (assume 16h waking day = 960 mins)
  const wakingDayMinutes = 960;
  const freeMinutes = Math.max(0, wakingDayMinutes - totalScheduledMinutes);
  const scheduledHours = Math.floor(totalScheduledMinutes / 60);
  const scheduledRemainingMins = totalScheduledMinutes % 60;
  const freeHours = Math.floor(freeMinutes / 60);
  const percentCommitted = Math.min(100, Math.round((totalScheduledMinutes / wakingDayMinutes) * 100));

  const [sy, sm, sd] = selectedDate.split('-').map(Number);
  const targetDateObj = new Date(sy, sm - 1, sd, 12, 0, 0);
  const dayOfWeekName = targetDateObj.toLocaleDateString('en-US', { weekday: 'long' });

  const formatTemp = (f: number | undefined) => {
    if (f == null) return '--';
    if (tempUnit === 'C') {
      const c = Math.round(((f - 32) * 5) / 9);
      return `${c}°C`;
    }
    return `${f}°F`;
  };

  // Weather Period Icon mapping
  const renderWeatherIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Sun':
        return <Sun className={`${className} text-amber-500`} />;
      case 'Sunset':
        return <Sunset className={`${className} text-rose-500`} />;
      case 'Moon':
        return <Moon className={`${className} text-indigo-400`} />;
      case 'CloudRain':
        return <CloudRain className={`${className} text-sky-500`} />;
      case 'Wind':
        return <Wind className={`${className} text-teal-500`} />;
      case 'Cloud':
        return <Cloud className={`${className} text-slate-400`} />;
      case 'CloudLightning':
        return <CloudLightning className={`${className} text-amber-600`} />;
      case 'CloudSnow':
        return <CloudSnow className={`${className} text-sky-300`} />;
      case 'CloudDrizzle':
        return <CloudDrizzle className={`${className} text-cyan-400`} />;
      case 'CloudFog':
        return <CloudFog className={`${className} text-stone-400`} />;
      case 'CloudSun':
      default:
        return <CloudSun className={`${className} text-amber-500`} />;
    }
  };



  return (
    <section 
      aria-label="Selected Day Summary Widget"
      className="my-1.5 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-white/95 dark:bg-[#1a1d22]/95 shadow-2xs transition-all duration-200 overflow-hidden"
    >
      {/* Top Header / Bar */}
      <div className="p-2.5 sm:p-3 bg-gradient-to-r from-stone-50 via-white to-stone-50 dark:from-[#202329] dark:via-[#1c1f25] dark:to-[#202329] border-b border-[#e6e1d8] dark:border-[#2d3139] flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: Day Title (Day of Week only) & Overnight Stay Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <span className="font-serif capitalize">{dayOfWeekName}</span>
              {isToday && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs">
                  Today
                </span>
              )}
            </h2>
          </div>

          {/* Overnight Stay badge */}
          {stayInfo && (
            <div 
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border shadow-2xs transition-colors ${
                stayInfo.stayAt === 'our_home'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-800'
                  : stayInfo.stayAt === 'her_home'
                  ? user1Theme.badgeBg
                  : user2Theme.badgeBg
              }`}
              title={`Stay: ${stayInfo.stayAt === 'our_home' ? 'Our Home' : stayInfo.stayAt === 'her_home' ? partner1Label : partner2Label}`}
            >
              <Home className="w-3 h-3" />
              <span>
                {stayInfo.stayAt === 'our_home'
                  ? 'Stay: Home'
                  : stayInfo.stayAt === 'her_home'
                  ? `Stay: ${partner1Label}`
                  : `Stay: ${partner2Label}`}
              </span>
            </div>
          )}
        </div>

        {/* Right: Compact stats double-spine (only when not expanded), °F/°C toggle, & Collapse toggle button */}
        <div className="flex items-center gap-2">
          {/* Quick Snapshot Double-Spine Cards (visible when NOT expanded) */}
          {isCollapsed && (
            <div 
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 cursor-pointer"
              title="Click to expand weather and astronomy details"
            >
              {/* Spine 1: Moon */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#252830] font-medium border border-stone-200 dark:border-[#353943] hover:bg-stone-200 dark:hover:bg-[#2e323c] transition-colors">
                <span className="text-sm leading-none">{moon.emoji}</span>
                <span className="hidden sm:inline font-sans">{moon.name} ({moon.illumination}%)</span>
              </span>

              {/* Spine 2: Radar Weather */}
              {isWithinHorizon && dayForecast ? (
                <span 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 transition-colors"
                  title={`Live Radar for ${currentLocation.name}: High ${formatTemp(dayForecast.highTemp)}, Low ${formatTemp(dayForecast.lowTemp)}`}
                >
                  {renderWeatherIcon(dayForecast.hourly[1]?.iconName || 'Sun', 'w-3 h-3')}
                  <span>{formatTemp(dayForecast.highTemp)} / {formatTemp(dayForecast.lowTemp)}</span>
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#252830] text-[11px] border border-stone-200 dark:border-[#353943]">
                  <span>Weather</span>
                </span>
              )}
            </div>
          )}

          {/* °F / °C Switcher */}
          <button
            type="button"
            onClick={() => setTempUnit((prev) => (prev === 'F' ? 'C' : 'F'))}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-[#e2ddd5] dark:border-[#353943] bg-stone-100 dark:bg-[#252830] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#2e323c] cursor-pointer"
            title="Toggle Temperature Unit (°F / °C)"
          >
            °{tempUnit}
          </button>

          {/* Expand / Collapse toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md border border-[#e2ddd5] dark:border-[#353943] bg-white dark:bg-[#252830] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#2e323c] cursor-pointer transition-colors"
            title={isCollapsed ? 'Expand Weather & Astronomy Cards' : 'Collapse Top Area'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Widget Body (Expanded) - 3 tightened columns */}
      {!isCollapsed && (
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-200">

          {/* Card 2: Phrase of the Day / Motivational Quote */}
          <div className="rounded-xl p-3 bg-stone-50/80 dark:bg-[#21242c] border border-stone-200/80 dark:border-[#2d3139] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-200 dark:border-[#2d3139]">
                <span className="text-[11px] font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  <span>Phrase of the Day</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                  {inspiration.theme}
                </span>
              </div>

              <div className="relative my-1.5 pl-2.5 border-l-2 border-rose-400 dark:border-rose-500">
                <Quote className="w-3.5 h-3.5 text-rose-400/60 mb-0.5" />
                <p className="text-xs italic font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
                  "{inspiration.quote}"
                </p>
                <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mt-1 text-right">
                  — {inspiration.author}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-[#2d3139] flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                <span>Daily Couple Reflection</span>
              </span>
              <span className="font-mono text-[9px]">{selectedDate}</span>
            </div>
          </div>

          {/* Card 3: Moon Phase for Everyday */}
          <div className="rounded-xl p-3 bg-stone-50/80 dark:bg-[#21242c] border border-stone-200/80 dark:border-[#2d3139] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-200 dark:border-[#2d3139]">
                <span className="text-[11px] font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span>Moon Phase</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                  {moon.illumination}% Lit
                </span>
              </div>

              <div className="flex items-center gap-2.5 my-1.5">
                <div className="text-3xl filter drop-shadow-sm select-none">
                  {moon.emoji}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                    {moon.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Day {moon.ageDays} of 29.5 lunar cycle
                  </p>
                </div>
              </div>

              {/* Illumination Bar */}
              <div className="space-y-1 mb-1.5">
                <div className="flex justify-between text-[10px] text-stone-600 dark:text-stone-400">
                  <span>Illumination</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{moon.illumination}%</span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-500 dark:bg-indigo-400 h-1.5 rounded-full" 
                    style={{ width: `${moon.illumination}%` }} 
                  />
                </div>
              </div>

              <p className="text-[10px] text-stone-600 dark:text-stone-300 italic bg-white/60 dark:bg-[#1a1d22]/60 p-1.5 rounded-lg border border-stone-200/60 dark:border-[#2d3139]">
                ✨ {moon.quoteTip}
              </p>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-[#2d3139] flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400">
              <span className="capitalize">Stage: {moon.stage}</span>
              <span className="text-[9px] font-mono">Synodic 29.5d</span>
            </div>
          </div>

          {/* Card 4: Verified Local Weather from Open-Meteo Live API */}
          <div className="rounded-xl p-3 bg-stone-50/80 dark:bg-[#21242c] border border-stone-200/80 dark:border-[#2d3139] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-200 dark:border-[#2d3139]">
                <span className="text-[11px] font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Thermometer className="w-3 h-3 text-amber-500" />
                  <span>Course of Day Weather</span>
                </span>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {isWithinHorizon && dayForecast
                    ? `${formatTemp(dayForecast.highTemp)} / ${formatTemp(dayForecast.lowTemp)}`
                    : diffDays > 14
                    ? 'Beyond 14d radar'
                    : 'Past Date'}
                </span>
              </div>

              {/* Status Badge: Open-Meteo Live API */}
              <div className="mb-1.5 flex items-center justify-between gap-1">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  isWithinHorizon && dayForecast
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : diffDays > 14
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isWithinHorizon && dayForecast ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>
                    {isWithinHorizon && dayForecast
                      ? 'Live Open-Meteo Radar'
                      : diffDays > 14
                      ? '14-Day Radar Horizon'
                      : 'Past Date Record'}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleRefreshWeather}
                  disabled={isLoadingWeather}
                  className="p-1 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                  title="Refresh live radar data"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingWeather ? 'animate-spin text-stone-800 dark:text-stone-200' : ''}`} />
                </button>
              </div>

              {/* Weather details or horizon notice */}
              {!isWithinHorizon || !dayForecast ? (
                <div className="my-2 p-2.5 rounded-lg bg-stone-100/70 dark:bg-[#1f2229] border border-stone-200/60 dark:border-[#2d3139] text-center space-y-1">
                  <CloudSun className="w-5 h-5 text-stone-400 mx-auto" />
                  <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    {diffDays > 14 ? '14-Day Meteorological Horizon' : 'Past Calendar Record'}
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                    {diffDays > 14
                      ? `Real-time radar forecasts are strictly accurate up to 14 days out (${diffDays} days away). Verified live forecasts will activate automatically as this day approaches.`
                      : 'Historical calendar date. Real-time radar operates for today through the next 14 days.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Overall Day Forecast Condition */}
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      {renderWeatherIcon(dayForecast.hourly[1]?.iconName || 'Sun', 'w-3 h-3')}
                      <span>{dayForecast.condition}</span>
                      {isToday && dayForecast.currentTemp != null && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          (Now {formatTemp(dayForecast.currentTemp)})
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">
                      {dayForecast.humidity}% hum · {dayForecast.windMph} mph
                    </span>
                  </div>

                  {/* 4 Periods Timeline: Morning, Midday, Evening, Night */}
                  <div className="grid grid-cols-2 gap-1.5 my-1">
                    {dayForecast.hourly.map((h) => (
                      <div 
                        key={h.period}
                        className="p-1.5 rounded-lg bg-white/70 dark:bg-[#1a1d22]/70 border border-stone-200/60 dark:border-[#2d3139] flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">{h.period}</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">{formatTemp(h.temp)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-[9px] text-stone-600 dark:text-stone-400 truncate">
                          {renderWeatherIcon(h.iconName, 'w-2.5 h-2.5 shrink-0')}
                          <span className="truncate">{h.condition}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Location button with modal trigger */}
            <div className="pt-2 border-t border-stone-200 dark:border-[#2d3139] flex items-center justify-between text-[10px]">
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 inline-flex items-center gap-1 cursor-pointer font-medium hover:underline max-w-[150px] truncate"
                title="Change weather location or detect GPS"
              >
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {currentLocation.name}{currentLocation.admin1 ? `, ${currentLocation.admin1}` : ''}
                </span>
              </button>

              <span className="text-[9px] text-stone-400">
                {dayForecast?.precipChance ?? 0}% rain
              </span>
            </div>
            {weatherError && (
              <p className="text-[9px] text-rose-500 mt-0.5">{weatherError}</p>
            )}
          </div>

        </div>
      )}

      {/* Notes / Stay Preview footer bar if available */}
      {stayInfo?.notes && (
        <div className="px-3 py-1.5 bg-stone-100/60 dark:bg-[#202329]/60 border-t border-stone-200 dark:border-[#2d3139] text-[11px] text-stone-700 dark:text-stone-300 flex items-center gap-2">
          <span className="font-semibold text-stone-800 dark:text-stone-200 shrink-0">Day Notes:</span>
          <span className="truncate italic">{stayInfo.notes}</span>
        </div>
      )}

      {/* Quick Location Search Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#202329] border border-[#e4ded5] dark:border-[#353943] shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200 dark:border-[#353943]">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Select Local Weather Source
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-3 leading-snug">
              Connected directly to the open Open-Meteo meteorological API for verified, real-time online weather.
            </p>

            {/* GPS 1-Click Button */}
            <button
              type="button"
              onClick={handleUseGpsLocation}
              disabled={isLoadingWeather}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Use Current GPS Location</span>
            </button>

            {/* City search form */}
            <form onSubmit={handleSearchLocations} className="space-y-2 mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city (e.g. Austin, Denver, London)..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-stone-200 dark:border-[#353943] bg-stone-50 dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="w-full py-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isSearching ? 'Searching...' : 'Search Location'}
              </button>
            </form>

            {searchError && (
              <p className="text-xs text-rose-500 mb-2">{searchError}</p>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto border-t border-stone-200 dark:border-[#353943] pt-2">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Matching Locations:
                </span>
                {searchResults.map((loc, idx) => (
                  <button
                    key={`${loc.name}-${loc.latitude}-${idx}`}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-[#252830] text-xs text-stone-800 dark:text-stone-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {loc.name}{loc.admin1 ? `, ${loc.admin1}` : ''} ({loc.country})
                    </span>
                    <Check className="w-3 h-3 text-emerald-600 opacity-80" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
