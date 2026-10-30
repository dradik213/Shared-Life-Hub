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
  Layers
} from 'lucide-react';
import { CalendarEvent, CalendarViewMode, DayStayInfo, EventCategory, EventSortOption, SortDirection } from '../types/calendar';
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
  const categoryKeys: EventCategory[] = ['market', 'dinner_date', 'maintenance', 'pets', 'grocery_errand', 'other'];

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
                <div className="relative">
                  <div className={`w-6 h-6 rounded-full ${currentUser.avatarColor || 'bg-purple-600'} text-white flex items-center justify-center font-bold text-[11px]`}>
                    {currentUser.name[0]}
                  </div>

                  {/* Notification badge on avatar */}
                  {unreadChatCount > 0 ? (
                    <span 
                      className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white ring-1 ring-white dark:ring-[#202329] shadow-xs"
                      title={`${unreadChatCount} unread chat messages`}
                    >
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  ) : overdueTasksCount > 0 ? (
                    <span 
                      className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white ring-1 ring-white dark:ring-[#202329] shadow-xs"
                      title={`${overdueTasksCount} overdue tasks`}
                    >
                      {overdueTasksCount > 9 ? '9+' : overdueTasksCount}
                    </span>
                  ) : null}
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

                  {/* Notification Markers Section inside Profile */}
                  {(unreadChatCount > 0 || overdueTasksCount > 0) && (
                    <div className="px-3 py-2 border-b border-[#e4ded5] dark:border-[#2d3139] bg-stone-50/70 dark:bg-[#1f2229]">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-stone-500 dark:text-stone-400 font-bold mb-1.5">
                        Notifications & Activity
                      </div>
                      <div className="space-y-1.5">
                        {unreadChatCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenChat) onOpenChat();
                              else if (onOpenWorkspaceModal) onOpenWorkspaceModal();
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="font-semibold text-[11px]">Unread Chat Messages</span>
                            </div>
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                              {unreadChatCount} new
                            </span>
                          </button>
                        )}

                        {overdueTasksCount > 0 && (
                          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="font-medium">Overdue Tasks</span>
                            </div>
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white font-bold text-[10px]">
                              {overdueTasksCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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

      {/* Middle Row: Selected Day Pulse & Summary Widget - Below daily schedule selection area and above activity type & sort filter */}
      {viewMode !== 'admin' && selectedDate && events && stays && (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#e5e0d8] dark:border-[#2d3139] pt-1.5 pb-0.5">
          <SelectedDaySummaryWidget
            selectedDate={selectedDate}
            events={events}
            stays={stays}
            onFilterCategory={onCategoryFilterChange}
            categoryFilter={categoryFilter}
          />
        </div>
      )}

      {/* Secondary Bar: Dynamic Navigation (Day/Week/Month/All Time) & Categories with Matching Background Colors */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-2 border-t border-[#e5e0d8] dark:border-[#2d3139] flex flex-wrap items-center justify-between gap-3 text-sm">
        
        {/* Top-left Navigation: Stays consistent, functions based on user view (Month, Week, Day, All Time) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

          <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight ml-1 sm:ml-2">
            {navLabel}
          </span>

          {/* 3-Position Partner Slider: to the right of the date using initials for both partners */}
          <div className="flex items-center gap-1.5 bg-[#f5f1e8] dark:bg-[#202329] px-2 py-0.5 rounded-lg border border-[#e4ded5] dark:border-[#2d3139] text-xs shadow-2xs ml-1 sm:ml-2 shrink-0">
            <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">View:</span>
            <button
              type="button"
              onClick={() => onPartnerFilterChange(partnerFilter === 'her' ? 'all' : 'her')}
              className={`w-5 h-5 flex items-center justify-center text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                partnerFilter === 'her'
                  ? `${user1Theme.activeText} ${user1Theme.activeBg} ring-1 ring-stone-400/40 dark:ring-stone-500/40 shadow-xs`
                  : `text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60`
              }`}
              title={`Filter by ${partner1DisplayName} (click again for Both)`}
              aria-label={`Filter by ${partner1DisplayName}`}
            >
              {partner1Initial}
            </button>

            {/* 3-Position Slider switch */}
            <button
              type="button"
              role="switch"
              aria-label={`Partner filter: ${partnerFilter === 'all' ? 'Both (Center)' : partnerFilter === 'her' ? partner1DisplayName : partner2DisplayName}`}
              onClick={() => {
                if (partnerFilter === 'her') onPartnerFilterChange('all');
                else if (partnerFilter === 'all') onPartnerFilterChange('him');
                else onPartnerFilterChange('her');
              }}
              className={`relative inline-flex h-5 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                partnerFilter === 'her'
                  ? user1Theme.sliderTrack
                  : partnerFilter === 'him'
                  ? user2Theme.sliderTrack
                  : 'bg-stone-300 dark:bg-stone-600 ring-1 ring-stone-400/50 dark:ring-stone-500/50'
              }`}
              title={`Current: ${partnerFilter === 'all' ? 'Both (Center)' : partnerFilter === 'her' ? partner1DisplayName : partner2DisplayName} (Click to cycle)`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ${
                  partnerFilter === 'her'
                    ? 'translate-x-0.5'
                    : partnerFilter === 'him'
                    ? 'translate-x-[30px]'
                    : 'translate-x-[16px] ring-1 ring-stone-400/50'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => onPartnerFilterChange(partnerFilter === 'him' ? 'all' : 'him')}
              className={`w-5 h-5 flex items-center justify-center text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                partnerFilter === 'him'
                  ? `${user2Theme.activeText} ${user2Theme.activeBg} ring-1 ring-stone-400/40 dark:ring-stone-500/40 shadow-xs`
                  : `text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60`
              }`}
              title={`Filter by ${partner2DisplayName} (click again for Both)`}
              aria-label={`Filter by ${partner2DisplayName}`}
            >
              {partner2Initial}
            </button>
          </div>
        </div>

        {/* Filter controls: Compact Icon-Only Category Chip Bar + Sort Dropdown */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {/* Categories: Compact Icon-Only Chip Bar with Tooltips */}
          <div className="flex items-center gap-1 shrink-0" role="toolbar" aria-label="Category filters">
            {/* "All" Category Icon Chip */}
            <button
              type="button"
              onClick={() => onCategoryFilterChange('all')}
              title="All Categories"
              aria-label="All Categories"
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold shadow-2xs'
                  : 'bg-stone-100 dark:bg-[#252830] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#2e323c] border border-stone-200/80 dark:border-[#353943]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
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
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center shrink-0 ${getCategoryButtonClasses(
                    key,
                    isSelected
                  )}`}
                >
                  {getCategoryIcon(key)}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown + Direction Toggle Arrow Button */}
          <div className="flex items-center gap-1.5 border-l border-[#e2ddd5] dark:border-[#353943] pl-2 shrink-0">
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
          </div>
        </div>

      </div>
    </header>
  );
};
