/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CalendarHeader } from './components/CalendarHeader';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { AgendaView } from './components/AgendaView';
import { InteractiveDaySchedule } from './components/InteractiveDaySchedule';
import { DayInspector } from './components/DayInspector';
import { AddEventModal } from './components/AddEventModal';
import { FridgePhotosModal } from './components/FridgePhotosModal';
import { ReflectionDashboard } from './components/ReflectionDashboard';
import { AdminPage } from './components/AdminPage';
import { LoginScreen } from './components/LoginScreen';
import { InvitePartnerModal } from './components/InvitePartnerModal';
import { EditProfileModal } from './components/EditProfileModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { UnifiedWorkspaceModal, UnifiedWorkspaceTab } from './components/UnifiedWorkspaceModal';
import { GoogleTaskItem } from './utils/googleWorkspace';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  subscribeToEvents, 
  saveEventToFirestore, 
  deleteEventFromFirestore, 
  subscribeToStays, 
  saveStayToFirestore, 
  subscribeToTemplates, 
  saveTemplateToFirestore, 
  deleteTemplateFromFirestore,
  subscribeToMessages
} from './utils/firebaseService';
import { CalendarEvent, CalendarViewMode, DayStayInfo, EventCategory, EventSortOption, EventTask, PlanTemplate, SortDirection, StayLocation } from './types/calendar';
import { INITIAL_EVENTS, MOCK_STAYS } from './data/mockEvents';
import { INITIAL_TEMPLATES } from './data/mockTemplates';
import { formatReadableDate, formatDateToYMD, matchesPartnerFilter, eventOccursOnDate } from './utils/calendarUtils';
import { Eye, Plus } from 'lucide-react';

function CalendarApp() {
  const { currentUser, currentHub, updateProfile } = useAuth();
  // Default to November 2026 test month for Dustin & Katherine
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    if (now.getFullYear() === 2026 && now.getMonth() === 10) return now;
    return new Date(2026, 10, 1);
  });
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => {
    try {
      const saved = localStorage.getItem('duosync_view_mode');
      if (saved && ['month', 'week', 'day', 'agenda', 'reflection'].includes(saved)) {
        return saved as CalendarViewMode;
      }
    } catch (e) {}
    return 'month';
  });

  useEffect(() => {
    try {
      localStorage.setItem('duosync_view_mode', viewMode);
    } catch (e) {}
  }, [viewMode]);

  const [reflectionTimeframe, setReflectionTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('month');
  
  // Day / Night Theme (Persisted per user account and localStorage)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('duosync_theme_preference');
      if (saved) return saved === 'dark';
    } catch (e) {}
    return false;
  });

  // Automatically sync theme when user profile loads or changes
  useEffect(() => {
    if (currentUser?.themePreference) {
      setIsDarkMode(currentUser.themePreference === 'dark');
    }
  }, [currentUser?.id, currentUser?.themePreference]);

  const handleToggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    try {
      localStorage.setItem('duosync_theme_preference', nextMode ? 'dark' : 'light');
    } catch (e) {}
    if (currentUser && updateProfile) {
      updateProfile({ themePreference: nextMode ? 'dark' : 'light' });
    }
  };

  // Selected date defaults to first day of November test schedule (2026-11-01)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = formatDateToYMD(new Date());
    if (today.startsWith('2026-11')) return today;
    return '2026-11-01';
  });
  const [isDayInspectorOpen, setIsDayInspectorOpen] = useState<boolean>(true);
  
  // Events and Stays state initialized with full November 2026 schedule for Dustin & Katherine
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('hub_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = [...parsed, ...INITIAL_EVENTS];
          const seenIds = new Set<string>();
          const seenKeys = new Set<string>();
          const deduped: CalendarEvent[] = [];
          for (const evt of combined) {
            const key = `${evt.title}_${evt.startDate}`;
            if (!seenIds.has(evt.id) && !seenKeys.has(key)) {
              seenIds.add(evt.id);
              seenKeys.add(key);
              deduped.push(evt);
            }
          }
          return deduped;
        }
      }
    } catch (e) {}
    return INITIAL_EVENTS;
  });

  const [stays, setStays] = useState<Record<string, DayStayInfo>>(() => {
    try {
      const saved = localStorage.getItem('hub_stays');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...MOCK_STAYS, ...parsed };
        }
      }
    } catch (e) {}
    return MOCK_STAYS;
  });

  // Persist events & stays
  useEffect(() => {
    try {
      localStorage.setItem('hub_events', JSON.stringify(events));
    } catch (e) {}
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('hub_stays', JSON.stringify(stays));
    } catch (e) {}
  }, [stays]);

  // Activity Templates state (managed in Admin page)
  const [templates, setTemplates] = useState<PlanTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('hub_templates');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TEMPLATES;
  });

  // Global sort option & direction with localStorage memory
  const [sortOption, setSortOption] = useState<EventSortOption>(() => {
    try {
      const saved = localStorage.getItem('hub_sort_option');
      if (saved && ['time', 'category', 'partner', 'tasks'].includes(saved)) {
        return saved as EventSortOption;
      }
    } catch (e) {}
    return 'time';
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    try {
      const saved = localStorage.getItem('hub_sort_direction');
      if (saved && ['none', 'asc', 'desc'].includes(saved)) {
        return saved as SortDirection;
      }
    } catch (e) {}
    return 'none';
  });

  // Remember preferred sorting attribute and direction
  useEffect(() => {
    try {
      localStorage.setItem('hub_sort_option', sortOption);
    } catch (e) {}
  }, [sortOption]);

  useEffect(() => {
    try {
      localStorage.setItem('hub_sort_direction', sortDirection);
    } catch (e) {}
  }, [sortDirection]);

  const handleToggleSortDirection = () => {
    setSortDirection((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'asc';
    });
  };

  // Filters: 'all' | 'her' | 'him' with persistent memory
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>(() => {
    try {
      const saved = localStorage.getItem('duosync_category_filter');
      if (saved) return saved as EventCategory | 'all';
    } catch (e) {}
    return 'all';
  });

  useEffect(() => {
    try {
      localStorage.setItem('duosync_category_filter', categoryFilter);
    } catch (e) {}
  }, [categoryFilter]);

  const [partnerFilter, setPartnerFilter] = useState<'all' | 'her' | 'him'>(() => {
    try {
      const saved = localStorage.getItem('duosync_partner_filter');
      if (saved && ['all', 'her', 'him'].includes(saved)) {
        return saved as 'all' | 'her' | 'him';
      }
    } catch (e) {}
    return 'all';
  });

  useEffect(() => {
    try {
      localStorage.setItem('duosync_partner_filter', partnerFilter);
    } catch (e) {}
  }, [partnerFilter]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addModalInitialDate, setAddModalInitialDate] = useState<string>(() => formatDateToYMD(new Date()));
  const [isFridgePhotosOpen, setIsFridgePhotosOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isUnifiedWorkspaceOpen, setIsUnifiedWorkspaceOpen] = useState<boolean>(false);
  const [unifiedWorkspaceTab, setUnifiedWorkspaceTab] = useState<UnifiedWorkspaceTab>('templates');
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<'ai_logger' | 'calendar' | 'tasks' | 'gmail' | 'chat'>('ai_logger');
  
  const [googleTasks, setGoogleTasks] = useState<GoogleTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('hub_google_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const handleSyncGoogleTasks = (tasks: GoogleTaskItem[]) => {
    setGoogleTasks(tasks);
    try {
      localStorage.setItem('hub_google_tasks', JSON.stringify(tasks));
    } catch (e) {}
  };

  // Chat tracking & notification markers
  const [chatMessages, setChatMessages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('duosync_shared_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [lastChatReadTime, setLastChatReadTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`duosync_last_read_chat_${currentUser?.id || 'default'}`);
      if (saved) return Number(saved);
    } catch (e) {}
    return Date.now() - 60000;
  });

  const handleChatRead = () => {
    const now = Date.now();
    setLastChatReadTime(now);
    try {
      if (currentUser?.id) {
        localStorage.setItem(`duosync_last_read_chat_${currentUser.id}`, String(now));
      }
    } catch (e) {}
  };

  // Tracking viewed templates for partner template notifications
  const [lastViewedTemplatesTime, setLastViewedTemplatesTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`duosync_last_viewed_templates_${currentUser?.id || 'default'}`);
      if (saved) return Number(saved);
    } catch (e) {}
    return Date.now();
  });

  const handleTemplatesViewed = () => {
    const now = Date.now();
    setLastViewedTemplatesTime(now);
    try {
      if (currentUser?.id) {
        localStorage.setItem(`duosync_last_viewed_templates_${currentUser.id}`, String(now));
      }
    } catch (e) {}
  };

  // Tracking whether user has already seen the partner invite alert (so red badge is non-persistent)
  const [hasSeenPartnerInviteNotice, setHasSeenPartnerInviteNotice] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`duosync_seen_partner_invite_${currentUser?.id || 'default'}`);
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  const markPartnerInviteSeen = () => {
    setHasSeenPartnerInviteNotice(true);
    try {
      localStorage.setItem(`duosync_seen_partner_invite_${currentUser?.id || 'default'}`, 'true');
    } catch (e) {}
  };

  // Count unread chats from partner (green badge marker)
  const unreadChatCount = useMemo(() => {
    if (!currentUser || !chatMessages || chatMessages.length === 0) return 0;
    return chatMessages.filter((msg) => {
      const isFromPartner = (msg.senderId && msg.senderId !== currentUser.id) || 
                            (msg.senderName && msg.senderName.toLowerCase() !== currentUser.name.toLowerCase());
      const msgTime = new Date(msg.timestamp).getTime();
      return isFromPartner && msgTime > lastChatReadTime;
    }).length;
  }, [currentUser, chatMessages, lastChatReadTime]);

  // Count overdue incomplete tasks (amber badge marker)
  const overdueTasksCount = useMemo(() => {
    const todayStr = formatDateToYMD(new Date());
    let count = 0;
    events.forEach((evt) => {
      if (evt.startDate < todayStr && evt.tasks) {
        evt.tasks.forEach((t) => {
          if (!t.completed) count++;
        });
      }
    });
    return count;
  }, [events]);

  // Tab-specific notification counts across Unified Workspace (strictly authentic, non-persistent signals)
  const workspaceNotifications = useMemo(() => {
    // 1. Templates: ONLY count if partner created a new template since last view
    const newPartnerTemplatesCount = templates.filter((t) => {
      if (!t.createdBy || !currentUser) return false;
      const isFromPartner = t.createdBy !== currentUser.id;
      const createdTime = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      return isFromPartner && createdTime > lastViewedTemplatesTime;
    }).length;

    // 2. Admin: alert (1) ONLY if partner has not yet joined hub AND user hasn't seen the notice yet (non-persistent badge)
    const isPartnerPending = (!currentHub || (currentHub.members && currentHub.members.length < 2));
    const admin = (isPartnerPending && !hasSeenPartnerInviteNotice) ? 1 : 0;

    // 3. Gemini: 0 by default; only alert if there are pending unreviewed AI suggestions
    const gemini = 0;

    // 4. Tasks: strictly overdue tasks (no fake badges for standard pending tasks)
    const tasks = overdueTasksCount;

    // 5. Calendar: 0 (unless calendar sync conflict)
    const calendar = 0;

    // 6. Gmail: 0 (unless urgent unread priority email)
    const gmail = 0;

    // 7. Chat: unread partner chat messages
    const chat = unreadChatCount;

    return {
      templates: newPartnerTemplatesCount,
      admin,
      gemini,
      tasks,
      calendar,
      gmail,
      chat,
    };
  }, [templates, currentUser, lastViewedTemplatesTime, currentHub, hasSeenPartnerInviteNotice, overdueTasksCount, unreadChatCount]);

  // Total notification sum displayed on the Pastel Heart button (only rendered if > 0)
  const totalHeartNotifications = useMemo(() => {
    return (
      workspaceNotifications.templates +
      workspaceNotifications.admin +
      workspaceNotifications.gemini +
      workspaceNotifications.tasks +
      workspaceNotifications.calendar +
      workspaceNotifications.gmail +
      workspaceNotifications.chat
    );
  }, [workspaceNotifications]);

  // Mark partner invite alert seen whenever user navigates to admin view or opens workspace
  useEffect(() => {
    if (viewMode === 'admin' || isUnifiedWorkspaceOpen || isInviteModalOpen) {
      markPartnerInviteSeen();
    }
  }, [viewMode, isUnifiedWorkspaceOpen, isInviteModalOpen]);

  // Sync dark class on documentElement and body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#14161a';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f7f4ed';
    }
  }, [isDarkMode]);

  // Compute Week bounds for current date
  const curr = new Date(currentDate);
  const dayOfWeek = (curr.getDay() + 6) % 7;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - dayOfWeek);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Dynamic Navigation Label based on active view mode and timeframe
  let navLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isWeekScope = viewMode === 'week' || (viewMode === 'reflection' && reflectionTimeframe === 'week');
  const isDayScope = viewMode === 'agenda' || (viewMode === 'reflection' && reflectionTimeframe === 'day');
  const isAllScope = viewMode === 'reflection' && reflectionTimeframe === 'all';

  if (viewMode === 'admin') {
    navLabel = 'Hub Admin & Templates';
  } else if (isDayScope) {
    const [sy, sm, sd] = selectedDate.split('-').map(Number);
    const dateOnlyObj = new Date(sy, sm - 1, sd, 12, 0, 0);
    navLabel = dateOnlyObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } else if (isWeekScope) {
    navLabel = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } else if (isAllScope) {
    navLabel = 'All Time History';
  }

  // Navigation handlers based on user selection
  const handlePrev = () => {
    if (isDayScope) {
      // Step back by 1 day
      const [y, m, d] = selectedDate.split('-').map(Number);
      const prevD = new Date(y, m - 1, d - 1);
      const prevStr = formatDateToYMD(prevD);
      setSelectedDate(prevStr);
      setCurrentDate(prevD);
    } else if (isWeekScope) {
      // Step back by 7 days
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
      setSelectedDate(formatDateToYMD(d));
    } else {
      // Month step
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      setCurrentDate(d);
      setSelectedDate(formatDateToYMD(d));
    }
  };

  const handleNext = () => {
    if (isDayScope) {
      // Step forward by 1 day
      const [y, m, d] = selectedDate.split('-').map(Number);
      const nextD = new Date(y, m - 1, d + 1);
      const nextStr = formatDateToYMD(nextD);
      setSelectedDate(nextStr);
      setCurrentDate(nextD);
    } else if (isWeekScope) {
      // Step forward by 7 days
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
      setSelectedDate(formatDateToYMD(d));
    } else {
      // Month step
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setCurrentDate(d);
      setSelectedDate(formatDateToYMD(d));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(formatDateToYMD(today));
    if (viewMode !== 'agenda') {
      setIsDayInspectorOpen(true);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const [y, m, d] = dateStr.split('-').map(Number);
    setCurrentDate(new Date(y, m - 1, d));
    if (viewMode !== 'agenda') {
      setIsDayInspectorOpen(true);
    }
  };

  // Real-time synchronization of Couple Hub data (Events, Stays, Templates) across devices
  useEffect(() => {
    if (!currentHub?.id || currentHub.id === 'hub-admin-default') return;

    // Real-time events listener
    const unsubEvents = subscribeToEvents(currentHub.id, (remoteEvents) => {
      if (remoteEvents.length > 0) {
        const combined = [...remoteEvents, ...INITIAL_EVENTS];
        const seenIds = new Set<string>();
        const seenKeys = new Set<string>();
        const deduped: CalendarEvent[] = [];
        for (const evt of combined) {
          const key = `${evt.title}_${evt.startDate}`;
          if (!seenIds.has(evt.id) && !seenKeys.has(key)) {
            seenIds.add(evt.id);
            seenKeys.add(key);
            deduped.push(evt);
          }
        }
        setEvents(deduped);
      }
    });

    // Real-time stays listener
    const unsubStays = subscribeToStays(currentHub.id, (remoteStays) => {
      if (Object.keys(remoteStays).length > 0) {
        setStays({ ...MOCK_STAYS, ...remoteStays });
      }
    });

    // Real-time templates listener
    const unsubTemplates = subscribeToTemplates(currentHub.id, (remoteTemplates) => {
      if (remoteTemplates.length > 0) {
        setTemplates(remoteTemplates);
      }
    });

    // Real-time couple chat messages listener
    const unsubMessages = subscribeToMessages(currentHub.id, (remoteMsgs) => {
      if (remoteMsgs.length > 0) {
        setChatMessages(remoteMsgs);
      }
    });

    return () => {
      unsubEvents();
      unsubStays();
      unsubTemplates();
      unsubMessages();
    };
  }, [currentHub?.id]);

  const handleUpdateStay = (date: string, stay: StayLocation) => {
    const label = stay === 'her_home' ? 'Hers' : stay === 'his_home' ? 'His' : stay === 'our_home' ? 'Home' : 'Away';
    const updatedStay: DayStayInfo = {
      date,
      stayAt: stay,
      label,
      notes: stays[date]?.notes || '',
    };
    setStays((prev) => ({
      ...prev,
      [date]: updatedStay,
    }));
    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      saveStayToFirestore(currentHub.id, updatedStay).catch(console.warn);
    }
  };

  const handleUpdateStayNotes = (date: string, notes: string) => {
    const updatedStay: DayStayInfo = {
      date,
      stayAt: stays[date]?.stayAt || 'her_home',
      label: stays[date]?.label || 'Hers',
      notes,
    };
    setStays((prev) => ({
      ...prev,
      [date]: updatedStay,
    }));
    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      saveStayToFirestore(currentHub.id, updatedStay).catch(console.warn);
    }
  };

  // Task slider toggle handler (on/off)
  const handleToggleTask = (eventId: string, taskId: string, completed: boolean) => {
    setEvents((prev) => {
      const updated = prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        const nextEvt = {
          ...evt,
          tasks: (evt.tasks || []).map((t) => (t.id === taskId ? { ...t, completed } : t)),
        };
        if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
          saveEventToFirestore(currentHub.id, nextEvt).catch(console.warn);
        }
        return nextEvt;
      });
      return updated;
    });
  };

  // Add individual task to specific event
  const handleAddTaskToEvent = (eventId: string, taskTitle: string, assignedTo?: 'both' | 'him' | 'her') => {
    const newTask: EventTask = {
      id: `t-${Date.now()}`,
      title: taskTitle.trim(),
      completed: false,
      assignedTo: assignedTo || 'both',
    };
    setEvents((prev) => {
      const updated = prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        const nextEvt = {
          ...evt,
          tasks: [...(evt.tasks || []), newTask],
        };
        if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
          saveEventToFirestore(currentHub.id, nextEvt).catch(console.warn);
        }
        return nextEvt;
      });
      return updated;
    });
  };

  // Delete individual task from specific event
  const handleDeleteTaskFromEvent = (eventId: string, taskId: string) => {
    setEvents((prev) => {
      const updated = prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        const nextEvt = {
          ...evt,
          tasks: (evt.tasks || []).filter((t) => t.id !== taskId),
        };
        if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
          saveEventToFirestore(currentHub.id, nextEvt).catch(console.warn);
        }
        return nextEvt;
      });
      return updated;
    });
  };

  // Copy past incomplete task into a target date
  const handleCopyTaskToDate = (sourceTaskTitle: string, targetDate: string, assignedTo?: 'both' | 'him' | 'her') => {
    const dayEvents = events.filter((e) => e.startDate === targetDate);
    if (dayEvents.length > 0) {
      handleAddTaskToEvent(dayEvents[0].id, sourceTaskTitle, assignedTo);
    } else {
      const newEvt: CalendarEvent = {
        id: `evt-rollover-${Date.now()}`,
        title: 'Daily Tasks & Rollover Chores',
        category: 'other',
        startDate: targetDate,
        assignedTo: assignedTo || 'both',
        tasks: [
          {
            id: `t-${Date.now()}`,
            title: sourceTaskTitle,
            completed: false,
            assignedTo: assignedTo || 'both',
          },
        ],
      };
      setEvents((prev) => [newEvt, ...prev]);
      if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
        saveEventToFirestore(currentHub.id, newEvt).catch(console.warn);
      }
    }
  };

  const handleOpenAddModal = (dateStr?: string) => {
    setAddModalInitialDate(dateStr || selectedDate || formatDateToYMD(new Date()));
    setIsAddModalOpen(true);
  };

  const handleSaveEvent = (newEventData: Omit<CalendarEvent, 'id'>) => {
    const newId = `evt-${Date.now()}`;
    const createdEvent: CalendarEvent = {
      ...newEventData,
      id: newId,
    };
    setEvents((prev) => [createdEvent, ...prev]);
    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      saveEventToFirestore(currentHub.id, createdEvent).catch(console.warn);
    }

    if (newEventData.overnightLocation) {
      handleUpdateStay(newEventData.startDate, newEventData.overnightLocation);
    }

    setSelectedDate(newEventData.startDate);
    setIsDayInspectorOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      deleteEventFromFirestore(currentHub.id, eventId).catch(console.warn);
    }
  };

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      saveEventToFirestore(currentHub.id, updatedEvent).catch(console.warn);
    }
  };

  // Activity Template Management Handlers (Admin)
  const handleUpdateTemplate = (updated: PlanTemplate) => {
    setTemplates((prev) => {
      const next = prev.map((t) => (t.id === updated.id ? updated : t));
      try { localStorage.setItem('hub_templates', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      saveTemplateToFirestore(currentHub.id, updated).catch(console.warn);
    }
  };

  const handleCreateTemplate = (newTmpl: PlanTemplate) => {
    setTemplates((prev) => {
      const next = [...prev, newTmpl];
      try { localStorage.setItem('hub_templates', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      saveTemplateToFirestore(currentHub.id, newTmpl).catch(console.warn);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== templateId);
      try { localStorage.setItem('hub_templates', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      deleteTemplateFromFirestore(currentHub.id, templateId).catch(console.warn);
    }
  };

  const handleResetTemplates = () => {
    setTemplates(INITIAL_TEMPLATES);
    try { localStorage.removeItem('hub_templates'); } catch (e) {}
  };

  const handleReorderTemplates = (reordered: PlanTemplate[]) => {
    setTemplates(reordered);
    try { localStorage.setItem('hub_templates', JSON.stringify(reordered)); } catch (e) {}
  };

  // Selected date's events (supports multi-day spans and partner filter)
  const selectedDateEvents = events.filter((e) => eventOccursOnDate(e, selectedDate) && matchesPartnerFilter(e.assignedTo, partnerFilter));
  const selectedDateStay = stays[selectedDate];

  if (!currentUser) {
    return (
      <LoginScreen
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? 'dark bg-[#14161a] text-[#f3f1ec]' : 'bg-[#f7f4ed] text-[#2b2927]'
      } flex flex-col font-sans selection:bg-stone-900 selection:text-white transition-colors duration-200`}
    >
      {/* Top Main Navigation & Calendar Filters - The ONLY Add Button is on the top right */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        navLabel={navLabel}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        partnerFilter={partnerFilter}
        onPartnerFilterChange={setPartnerFilter}
        sortOption={sortOption}
        sortDirection={sortDirection}
        onSortOptionChange={setSortOption}
        onToggleSortDirection={handleToggleSortDirection}
        onOpenAddModal={() => handleOpenAddModal(selectedDate)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenInviteModal={() => {
          setIsInviteModalOpen(true);
          markPartnerInviteSeen();
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenUnifiedWorkspace={() => {
          setUnifiedWorkspaceTab('templates');
          setIsUnifiedWorkspaceOpen(true);
          handleTemplatesViewed();
          markPartnerInviteSeen();
        }}
        unreadChatCount={unreadChatCount}
        overdueTasksCount={overdueTasksCount}
        totalHeartNotifications={totalHeartNotifications}
        tabNotificationCounts={workspaceNotifications}
        onOpenChat={() => {
          setUnifiedWorkspaceTab('chat');
          setIsUnifiedWorkspaceOpen(true);
          handleChatRead();
        }}
        selectedDate={selectedDate}
        events={events}
        stays={stays}
      />

      {/* Main Content Area: generous wide layout filling high-resolution and widescreen displays */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-3 sm:p-5 lg:p-6">
        
        {/* View Mode Switching */}
        {viewMode === 'admin' ? (
          /* Hub Admin Page: Template Management as Primary Function */
          <AdminPage
            templates={templates}
            onUpdateTemplate={handleUpdateTemplate}
            onCreateTemplate={handleCreateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onReorderTemplates={handleReorderTemplates}
            onResetTemplates={handleResetTemplates}
            onBackToCalendar={() => setViewMode('month')}
            onClearAllEventsAndStays={() => {
              setEvents([]);
              setStays({});
              localStorage.removeItem('hub_events');
              localStorage.removeItem('hub_stays');
            }}
            onOpenInviteModal={() => setIsInviteModalOpen(true)}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />
        ) : viewMode === 'reflection' ? (
          /* Reflection & Monthly Sum Dashboard with Day/Week/Month/All Time support */
          <ReflectionDashboard
            events={events}
            stays={stays}
            currentDate={currentDate}
            selectedDate={selectedDate}
            timeframe={reflectionTimeframe}
            onTimeframeChange={setReflectionTimeframe}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            onNavigateToDay={(date) => {
              setSelectedDate(date);
              setViewMode('month');
              setIsDayInspectorOpen(true);
            }}
          />
        ) : viewMode === 'agenda' ? (
          /* Dedicated Interactive Colorful Day Schedule (Day View removed here per user request) */
          <div className="w-full max-w-5xl xl:max-w-6xl mx-auto">
            <InteractiveDaySchedule
              currentDate={currentDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              events={events}
              allEvents={events}
              stays={stays}
              googleTasks={googleTasks}
              onUpdateStay={handleUpdateStay}
              onUpdateStayNotes={handleUpdateStayNotes}
              onToggleTask={handleToggleTask}
              onAddTaskToEvent={handleAddTaskToEvent}
              onDeleteTaskFromEvent={handleDeleteTaskFromEvent}
              onCopyTaskToDate={handleCopyTaskToDate}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              onOpenFridgePhotos={() => setIsFridgePhotosOpen(true)}
              onOpenAddModal={handleOpenAddModal}
              categoryFilter={categoryFilter}
              partnerFilter={partnerFilter}
              sortOption={sortOption}
              sortDirection={sortDirection}
            />
          </div>
        ) : (
          /* Calendar Grid / Week Flow Layout + Day Inspector */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left/Main Column: Generous wide calendar column */}
            <div
              className={`transition-all duration-300 ${
                viewMode === 'month' && isDayInspectorOpen ? 'lg:col-span-8 xl:col-span-8 2xl:col-span-9' : 'lg:col-span-12'
              }`}
            >
              {viewMode === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  events={events}
                  stays={stays}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  onToggleTask={handleToggleTask}
                  categoryFilter={categoryFilter}
                  partnerFilter={partnerFilter}
                  sortOption={sortOption}
                  sortDirection={sortDirection}
                />
              )}

              {viewMode === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  events={events}
                  stays={stays}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  onToggleTask={handleToggleTask}
                  onAddTaskToEvent={handleAddTaskToEvent}
                  onDeleteTaskFromEvent={handleDeleteTaskFromEvent}
                  onDeleteEvent={handleDeleteEvent}
                  categoryFilter={categoryFilter}
                  partnerFilter={partnerFilter}
                  sortOption={sortOption}
                  sortDirection={sortDirection}
                />
              )}

              {/* Bottom Quick-Back Bar - Only for month view */}
              {viewMode === 'month' && (
                <div className="mt-3 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
                  <p>
                    Click any day to view details, toggle tasks, or record bullet notes.
                  </p>
                  {!isDayInspectorOpen && (
                    <button
                      type="button"
                      onClick={() => setIsDayInspectorOpen(true)}
                      className="font-medium text-stone-800 dark:text-stone-200 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Day Details</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Day Details Inspector - ONLY when viewMode === 'month' */}
            {viewMode === 'month' && isDayInspectorOpen && (
              <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 sticky top-24 space-y-4">
                <DayInspector
                  selectedDate={selectedDate}
                  events={selectedDateEvents}
                  allEvents={events}
                  stayInfo={selectedDateStay}
                  onClose={() => setIsDayInspectorOpen(false)}
                  onUpdateStay={handleUpdateStay}
                  onUpdateStayNotes={handleUpdateStayNotes}
                  onToggleTask={handleToggleTask}
                  onAddTaskToEvent={handleAddTaskToEvent}
                  onDeleteTaskFromEvent={handleDeleteTaskFromEvent}
                  onCopyTaskToDate={handleCopyTaskToDate}
                  onDeleteEvent={handleDeleteEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onOpenFridgePhotos={() => setIsFridgePhotosOpen(true)}
                  sortOption={sortOption}
                  sortDirection={sortDirection}
                />
              </div>
            )}

          </div>
        )}
      </main>
 
      {/* Floating Action Button (+ Add) in bottom-right corner for 1-tap quick add */}
      <button
        type="button"
        onClick={() => handleOpenAddModal(selectedDate)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer group ring-2 ring-white/60 dark:ring-stone-900/40"
        title="Add new event, task or stay (+)"
        aria-label="Add new event, task or stay"
      >
        <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Add Activity Modal with dynamic templates & edit button */}
      <AddEventModal
        isOpen={isAddModalOpen}
        initialDate={addModalInitialDate}
        allEvents={events}
        templates={templates}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveEvent}
        onOpenAdmin={() => setViewMode('admin')}
      />

      {/* Compact Fridge Photos Modal */}
      <FridgePhotosModal
        isOpen={isFridgePhotosOpen}
        onClose={() => setIsFridgePhotosOpen(false)}
        dateStr={selectedDate}
      />

      {/* Invite Partner Modal */}
      <InvitePartnerModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Edit Profile & Gender Modal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenWorkspaceModal={() => {
          setUnifiedWorkspaceTab('gemini');
          setIsUnifiedWorkspaceOpen(true);
        }}
      />

      {/* Unified Workspace & Admin Full-Screen Modal Overlay */}
      <UnifiedWorkspaceModal
        isOpen={isUnifiedWorkspaceOpen}
        onClose={() => setIsUnifiedWorkspaceOpen(false)}
        initialTab={unifiedWorkspaceTab}
        selectedDate={selectedDate}
        templates={templates}
        onUpdateTemplate={handleUpdateTemplate}
        onCreateTemplate={handleCreateTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onReorderTemplates={handleReorderTemplates}
        onResetTemplates={handleResetTemplates}
        onClearAllEventsAndStays={() => {
          setEvents([]);
          setStays({});
          try {
            localStorage.removeItem('hub_events');
            localStorage.removeItem('hub_stays');
          } catch (e) {}
        }}
        onLoadNovemberTestData={() => {
          setEvents(INITIAL_EVENTS);
          setStays(MOCK_STAYS);
          setCurrentDate(new Date(2026, 10, 1));
          setSelectedDate('2026-11-01');
          try {
            localStorage.setItem('hub_events', JSON.stringify(INITIAL_EVENTS));
            localStorage.setItem('hub_stays', JSON.stringify(MOCK_STAYS));
          } catch (e) {}
        }}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onAddEventFromAI={handleSaveEvent}
        onImportGoogleTaskToBacklog={(taskTitle) => handleCopyTaskToDate(taskTitle, selectedDate, 'both')}
        onSyncGoogleTasks={handleSyncGoogleTasks}
        onMessagesUpdated={(msgs) => setChatMessages(msgs)}
        onChatRead={handleChatRead}
        onTemplatesViewed={handleTemplatesViewed}
        onPartnerInviteViewed={markPartnerInviteSeen}
        unreadChatCount={unreadChatCount}
        tabNotifications={workspaceNotifications}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CalendarApp />
    </AuthProvider>
  );
}
