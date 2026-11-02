import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart,
  Store,
  Wrench,
  UtensilsCrossed,
  Luggage,
  PawPrint,
  ShoppingCart,
  Calendar as CalendarIcon,
  Sun,
  Moon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings,
  Users,
  UserPlus,
  LogOut,
  RefreshCw,
  User,
  Sparkles,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { CalendarEvent, CalendarViewMode, DayStayInfo, EventCategory, EventSortOption, SortDirection, StayLocation } from '../types/calendar';
import { CATEGORY_CONFIG } from '../utils/calendarUtils';
import { useAuth } from '../context/AuthContext';
import { SelectedDaySummaryWidget } from './SelectedDaySummaryWidget';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  navLabel: string;
  categoryFilter: EventCategory | 'all';
  onCategoryFilterChange: (cat: EventCategory | 'all') => void;
  partnerFilter: 'all' | 'her' | 'him';
  onPartnerFilterChange: (partner: 'all' | 'her' | 'him') => void;
  sortOption: EventSortOption;
  sortDirection: SortDirection;
  onSortOptionChange: (sort: EventSortOption) => void;
  onToggleSortDirection: () => void;
  onOpenAddModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenInviteModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenWorkspaceModal?: () => void;
  onOpenUnifiedWorkspace?: () => void;
  unreadChatCount?: number;
  overdueTasksCount?: number;
  totalHeartNotifications?: number;
  tabNotificationCounts?: {
    templates?: number;
    admin?: number;
    gemini?: number;
    tasks?: number;
    calendar?: number;
    gmail?: number;
    chat?: number;
  };
  onOpenChat?: () => void;
  selectedDate?: string;
  events?: CalendarEvent[];
  stays?: Record<string, DayStayInfo>;
  onUpdateStay?: (date: string, location: StayLocation) => void;
  onOpenFridgePhotos?: () => void;
  photoCount?: number;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  navLabel,
  categoryFilter,
  onCategoryFilterChange,
  partnerFilter,
  onPartnerFilterChange,
  sortOption,
  sortDirection,
  onSortOptionChange,
  onToggleSortDirection,
  onOpenAddModal,
  isDarkMode,
  onToggleDarkMode,
  onOpenInviteModal,
  onOpenProfileModal,
  onOpenWorkspaceModal,
  onOpenUnifiedWorkspace,
  unreadChatCount = 0,
  overdueTasksCount = 0,
  totalHeartNotifications,
  tabNotificationCounts,
  onOpenChat,
  selectedDate,
  events,
  stays,
  onUpdateStay,
  onOpenFridgePhotos,
  photoCount = 0,
}) => {
  const { 
    currentUser, 
    currentHub, 
    partnerUser, 
    coupleViewLabel, 
    partner1Label, 
    partner2Label, 
    partner1Initial, 
    partner2Initial, 
    partner1DisplayName, 
    partner2DisplayName, 
    user1Theme, 
    user2Theme, 
    logout, 
    switchUser 
  } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isFilterSortOpen, setIsFilterSortOpen] = useState(false);
  const categoryKeys: EventCategory[] = ['market', 'dinner_date', 'maintenance', 'pets', 'grocery_errand', 'other'];
  const isAnyFilterActive = partnerFilter !== 'all' || categoryFilter !== 'all' || sortOption !== 'time' || sortDirection !== 'none';
  const activeFilterCount = (partnerFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0) + (sortOption !== 'time' ? 1 : 0) + (sortDirection !== 'none' ? 1 : 0);

  const handleResetFilters = () => {
    onPartnerFilterChange('all');
    onCategoryFilterChange('all');
    onSortOptionChange('time');
    if (sortDirection !== 'none') {
      onToggleSortDirection();
    }
  };

  // Sum of critical notifications across all tabs or fallback to chat + tasks
  const totalNotifications = totalHeartNotifications ?? (
    (tabNotificationCounts 
      ? Object.values(tabNotificationCounts).reduce((sum, n) => sum + (n || 0), 0)
      : (unreadChatCount + overdueTasksCount))
  );

  const getCategoryIcon = (key: EventCategory) => {
    switch (key) {
      case 'market': return <Store className="w-3.5 h-3.5" />;
      case 'dinner_date': return <UtensilsCrossed className="w-3.5 h-3.5" />;
      case 'maintenance': return <Wrench className="w-3.5 h-3.5" />;
      case 'pets': return <PawPrint className="w-3.5 h-3.5" />;
      case 'packing': return <PawPrint className="w-3.5 h-3.5" />;
      case 'grocery_errand': return <ShoppingCart className="w-3.5 h-3.5" />;
      default: return <CalendarIcon className="w-3.5 h-3.5" />;
    }
  };

  // Distinct background colors for category buttons when active or inactive
  const getCategoryButtonClasses = (key: EventCategory, isSelected: boolean) => {
    switch (key) {
      case 'market':
        return isSelected
          ? 'bg-amber-500 dark:bg-yellow-400 text-stone-950 font-bold shadow-2xs'
          : 'bg-amber-100/70 hover:bg-amber-200/80 text-amber-950 dark:bg-yellow-950/40 dark:hover:bg-yellow-900/50 dark:text-yellow-300 border border-amber-300 dark:border-yellow-600/60';
      case 'dinner_date':
        return isSelected
          ? 'bg-rose-600 text-white font-semibold shadow-2xs'
          : 'bg-rose-100/70 hover:bg-rose-200/80 text-rose-950 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-300 dark:border-rose-500/60';
      case 'maintenance':
        return isSelected
          ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
          : 'bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-950 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/60';
      case 'pets':
      case 'packing':
        return isSelected
          ? 'bg-sky-600 text-white font-semibold shadow-2xs'
          : 'bg-sky-100/70 hover:bg-sky-200/80 text-sky-950 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 dark:text-sky-200 border border-sky-300 dark:border-sky-800/60';
      case 'grocery_errand':
        return isSelected
          ? 'bg-purple-600 text-white font-semibold shadow-2xs'
          : 'bg-purple-100/70 hover:bg-purple-200/80 text-purple-950 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 dark:text-purple-200 border border-purple-300 dark:border-purple-800/60';
      case 'other':
        return isSelected
          ? 'bg-stone-700 text-white font-semibold shadow-2xs'
          : 'bg-stone-200/80 hover:bg-stone-300/80 text-stone-900 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700';
    }
  };

  return (
    <header className="border-b border-[#e5e0d8] dark:border-[#2d3139] bg-[#fbf9f5]/95 dark:bg-[#181a1e]/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* Top Bar: Reorganized for mobile & desktop with +Add on Top-Left, Soft Pastel Heart, and Non-Wrapping Layout */}
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Left Side: + Add Button, Soft Blush Rose Pastel Heart, Shared Life Hub */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Soft Blush Rose Pastel Heart Button */}
          <button
            type="button"
            onClick={onOpenUnifiedWorkspace || onOpenWorkspaceModal}
            className="relative flex items-center justify-center p-2 rounded-xl bg-rose-50 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200/90 dark:border-rose-800/60 shadow-2xs hover:shadow-xs hover:border-rose-300 dark:hover:border-rose-700 active:scale-95 transition-all cursor-pointer group shrink-0"
            title={`Open Unified Workspace & Admin (${totalNotifications} notification${totalNotifications === 1 ? '' : 's'})`}
            aria-label={`Open Unified Workspace & Admin (${totalNotifications} notifications)`}
          >
            <Heart className="w-4 h-4 fill-rose-300/60 text-rose-500 drop-shadow-2xs group-hover:scale-105 transition-transform" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex min-w-[17px] h-[17px] px-1 items-center justify-center rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] font-bold ring-2 ring-[#fbf9f5] dark:ring-[#181a1e] shadow-xs">
                {totalNotifications > 99 ? '99+' : totalNotifications}
              </span>
            )}
          </button>

          {/* Brand Title: Synchronized with currentHub?.name from Admin */}
          <h1 className="text-sm sm:text-base md:text-lg font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
            <span className="sm:hidden">Life Hub</span>
            <span className="hidden sm:inline">{currentHub?.name || 'Shared Life Hub'}</span>
          </h1>
        </div>

        {/* Right Side: Responsive View Switcher & Compact Avatar (User name removed to prevent mobile wrapping) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Segmented View Control - Compact on mobile, full on desktop */}
          <div className="flex items-center bg-stone-200/60 dark:bg-[#24272f] p-0.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400">
            <button
              type="button"
              onClick={() => onViewModeChange('agenda')}
              className={`px-2 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-[#2e323c] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="Daily Schedule"
            >
              <span className="sm:hidden">Day</span>
              <span className="hidden sm:inline">Daily Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('week')}
              className={`px-2 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-[#2e323c] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="Week Flow"
            >
              <span className="sm:hidden">Week</span>
              <span className="hidden sm:inline">Week Flow</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('month')}
              className={`px-2 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-[#2e323c] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="Monthly Review"
            >
              <span className="sm:hidden">Month</span>
              <span className="hidden sm:inline">Monthly Review</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('reflection')}
              className={`px-2 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'reflection'
                  ? 'bg-white dark:bg-[#2e323c] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="Reflect & Summary"
            >
              <span className="sm:hidden">Reflect</span>
              <span className="hidden sm:inline">Reflect & Summary</span>
            </button>
          </div>

          {/* User Account Button: Clean Avatar circle without name text clutter in top bar */}
          {currentUser && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative flex items-center justify-center p-1 rounded-lg border border-[#e5e0d8] dark:border-[#353943] bg-white dark:bg-[#202329] hover:bg-stone-50 dark:hover:bg-[#2a2e36] cursor-pointer shadow-2xs transition-all shrink-0"
                title={`Account: ${currentUser.name} (${currentUser.gender})`}
                aria-label={`Account menu for ${currentUser.name}`}
              >
                <div className={`w-6 h-6 rounded-full ${currentUser.avatarColor || 'bg-purple-600'} text-white flex items-center justify-center font-bold text-[11px]`}>
                  {currentUser.name[0]}
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#2d3139] rounded-xl shadow-xl py-2 z-50 text-xs animate-in fade-in"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-3.5 py-2 border-b border-[#e4ded5] dark:border-[#2d3139]">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-900 dark:text-stone-100 truncate">{currentUser.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">{coupleViewLabel}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 capitalize mt-0.5">{currentUser.email}</p>
                  </div>

                  {/* Day / Night View Switcher (Living in Profile Settings) */}
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className="w-full text-left px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-[#24272f] text-stone-800 dark:text-stone-200 flex items-center justify-between cursor-pointer border-b border-[#e4ded5] dark:border-[#2d3139]"
                  >
                    <div className="flex items-center gap-2">
                      {isDarkMode ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-500" />
                      )}
                      <div>
                        <div className="font-semibold text-xs">{isDarkMode ? 'Switch to Day View' : 'Switch to Night View'}</div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">Preferred view theme</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-[#2a2e36] text-stone-600 dark:text-stone-300">
                      {isDarkMode ? 'Night' : 'Day'}
                    </span>
                  </button>

                  {/* Edit Profile & Gender */}
                  {onOpenProfileModal && (
                    <button
                      type="button"
                      onClick={onOpenProfileModal}
                      className="w-full text-left px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-[#24272f] text-stone-700 dark:text-stone-300 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      <span>Edit Profile & Gender</span>
                    </button>
                  )}

                  {onOpenInviteModal && (
                    <button
                      type="button"
                      onClick={onOpenInviteModal}
                      className="w-full text-left px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-[#24272f] text-stone-700 dark:text-stone-300 flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-stone-500" />
                      <span>Invite Partner / Hub Code</span>
                    </button>
                  )}

                  {partnerUser && (
                    <button
                      type="button"
                      onClick={() => switchUser(partnerUser.id)}
                      className="w-full text-left px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-[#24272f] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2 cursor-pointer border-t border-[#e4ded5] dark:border-[#2d3139]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Switch to {partnerUser.name}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2 cursor-pointer border-t border-[#e4ded5] dark:border-[#2d3139]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Unified Sub-Header Row: Navigation, Stay/Date Pill, Weather Dropdown, Camera, Filter & Sort */}
      {viewMode !== 'admin' && viewMode !== 'reflection' && (
        <SelectedDaySummaryWidget
          selectedDate={selectedDate || ''}
          events={events || []}
          stays={stays || {}}
          onFilterCategory={onCategoryFilterChange}
          categoryFilter={categoryFilter}
          onUpdateStay={onUpdateStay}
          onOpenFridgePhotos={onOpenFridgePhotos}
          photoCount={photoCount}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          navLabel={navLabel}
          viewMode={viewMode}
          isFilterSortOpen={isFilterSortOpen}
          onToggleFilterSort={() => setIsFilterSortOpen(!isFilterSortOpen)}
          isAnyFilterActive={isAnyFilterActive}
          activeFilterCount={activeFilterCount}
          partnerFilter={partnerFilter}
        />
      )}

      {/* Reflection view period navigation bar */}
      {viewMode === 'reflection' && (
        <div className="w-full max-w-[1800px] mx-auto px-2.5 sm:px-6 lg:px-8 py-2 border-t border-[#e5e0d8] dark:border-[#2d3139] flex items-center justify-between gap-2 flex-nowrap text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
            <div className="flex items-center border border-[#e2ddd5] dark:border-[#353943] rounded-lg overflow-hidden bg-white dark:bg-[#202329] shadow-2xs shrink-0">
              <button
                type="button"
                onClick={onPrev}
                aria-label="Previous period"
                className="p-1 hover:bg-stone-100 dark:hover:bg-[#2a2e36] text-stone-600 dark:text-stone-300 transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNext}
                aria-label="Next period"
                className="p-1 hover:bg-stone-100 dark:hover:bg-[#2a2e36] text-stone-600 dark:text-stone-300 transition-colors border-l border-[#e2ddd5] dark:border-[#353943] cursor-pointer shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onToday}
              className="text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-[#e2ddd5] dark:border-[#353943] hover:bg-white dark:hover:bg-[#22252b] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Today
            </button>

            <span className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight ml-1 sm:ml-2 truncate">
              {navLabel}
            </span>
          </div>
        </div>
      )}

      {/* Collapsible Category Filter & Sort Toolbar Row */}
      {isFilterSortOpen && viewMode !== 'reflection' && viewMode !== 'admin' && (
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 bg-stone-50/95 dark:bg-[#1a1d22]/95 border-t border-[#e5e0d8] dark:border-[#2d3139] flex flex-col gap-1.5 text-xs animate-in fade-in duration-150 overflow-x-hidden max-w-full">
          
          {/* Row 1: Compact Partner View on Left & Sort Controls on Right */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200/60 dark:border-stone-800">
            {/* Left: Compact Partner View */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-700 text-xs shadow-2xs shrink-0">
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">View:</span>
              <button
                type="button"
                onClick={() => onPartnerFilterChange(partnerFilter === 'her' ? 'all' : 'her')}
                className={`w-4.5 h-4.5 flex items-center justify-center text-[11px] font-bold rounded transition-all cursor-pointer ${
                  partnerFilter === 'her'
                    ? `${user1Theme.activeText} ${user1Theme.activeBg} ring-1 ring-stone-400/40 dark:ring-stone-500/40 shadow-xs`
                    : `text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60`
                }`}
                title={`Filter by ${partner1DisplayName} (click again for K&D)`}
                aria-label={`Filter by ${partner1DisplayName}`}
              >
                {partner1Initial}
              </button>

              {/* Compact 3-Position Slider switch */}
              <button
                type="button"
                role="switch"
                aria-label={`Partner filter: ${partnerFilter === 'all' ? 'K&D (Center)' : partnerFilter === 'her' ? partner1DisplayName : partner2DisplayName}`}
                onClick={() => {
                  if (partnerFilter === 'her') onPartnerFilterChange('all');
                  else if (partnerFilter === 'all') onPartnerFilterChange('him');
                  else onPartnerFilterChange('her');
                }}
                className={`relative inline-flex h-4 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  partnerFilter === 'her'
                    ? user1Theme.sliderTrack
                    : partnerFilter === 'him'
                    ? user2Theme.sliderTrack
                    : 'bg-stone-300 dark:bg-stone-600 ring-1 ring-stone-400/50 dark:ring-stone-500/50'
                }`}
                title={`Current: ${partnerFilter === 'all' ? 'K&D (Center)' : partnerFilter === 'her' ? partner1DisplayName : partner2DisplayName} (Click to cycle)`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ${
                    partnerFilter === 'her'
                      ? 'translate-x-0.5'
                      : partnerFilter === 'him'
                      ? 'translate-x-[22px]'
                      : 'translate-x-[11px] ring-1 ring-stone-400/50'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => onPartnerFilterChange(partnerFilter === 'him' ? 'all' : 'him')}
                className={`w-4.5 h-4.5 flex items-center justify-center text-[11px] font-bold rounded transition-all cursor-pointer ${
                  partnerFilter === 'him'
                    ? `${user2Theme.activeText} ${user2Theme.activeBg} ring-1 ring-stone-400/40 dark:ring-stone-500/40 shadow-xs`
                    : `text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60`
                }`}
                title={`Filter by ${partner2DisplayName} (click again for K&D)`}
                aria-label={`Filter by ${partner2DisplayName}`}
              >
                {partner2Initial}
              </button>
            </div>

            {/* Right side: Sort + Reset button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <label htmlFor="sort-select" className="text-[11px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider hidden sm:inline cursor-pointer">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={(e) => onSortOptionChange(e.target.value as EventSortOption)}
                className="bg-white dark:bg-[#24272f] border border-[#e2ddd5] dark:border-[#353943] text-stone-800 dark:text-stone-200 text-xs rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer shadow-2xs font-medium"
                title="Select attribute to sort by"
              >
                <option value="time">Time</option>
                <option value="category">Category</option>
                <option value="partner">Lead</option>
                <option value="tasks">Tasks</option>
              </select>

              {/* Direction toggle arrow button */}
              <button
                type="button"
                onClick={onToggleSortDirection}
                title={
                  sortDirection === 'none'
                    ? `Natural order (not sorted by ${sortOption === 'time' ? 'time' : sortOption}). Click to sort ascending`
                    : sortDirection === 'asc'
                    ? `Sorted ascending by ${sortOption === 'time' ? 'time' : sortOption}. Click to flip descending`
                    : `Sorted descending by ${sortOption === 'time' ? 'time' : sortOption}. Click to flip ascending`
                }
                className={`p-1 rounded-md border text-xs transition-all cursor-pointer flex items-center justify-center ${
                  sortDirection === 'none'
                    ? 'bg-white dark:bg-[#24272f] border-[#e2ddd5] dark:border-[#353943] text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:border-stone-400 shadow-2xs'
                    : 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs font-bold ring-1 ring-stone-900 dark:ring-stone-100'
                }`}
                aria-label="Toggle sort order direction"
              >
                {sortDirection === 'none' ? (
                  <ArrowUpDown className="w-3.5 h-3.5" />
                ) : sortDirection === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Quick Reset Filters button if any filter is active */}
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                  title="Reset all filters and sorting to default"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Category Filter Pills wrapping cleanly within mobile viewport */}
          <div className="w-full max-w-full flex flex-wrap items-center gap-1.5 pt-1" role="toolbar" aria-label="Category filter toolbar">
            <button
              type="button"
              onClick={() => onCategoryFilterChange('all')}
              title="All Categories"
              aria-label="All Categories"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold shadow-2xs'
                  : 'bg-stone-100 dark:bg-[#252830] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#2e323c] border border-stone-200/80 dark:border-[#353943]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>All</span>
            </button>

            {categoryKeys.map((key) => {
              const meta = CATEGORY_CONFIG[key];
              const isSelected = categoryFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onCategoryFilterChange(key)}
                  title={meta.label}
                  aria-label={meta.label}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${getCategoryButtonClasses(
                    key,
                    isSelected
                  )}`}
                >
                  {getCategoryIcon(key)}
                  <span>{meta.shortLabel || meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
