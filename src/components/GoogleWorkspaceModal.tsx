import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Mail, 
  MessageSquare, 
  RefreshCw, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Plus, 
  Clock, 
  Copy,
  LogOut,
  UserCheck
} from 'lucide-react';
import { CalendarEvent, EventCategory } from '../types/calendar';
import { 
  auth,
  initGoogleAuth, 
  signInWithGoogle, 
  signOutGoogle, 
  getAccessToken,
  fetchGoogleCalendarEvents, 
  createGoogleCalendarEvent,
  fetchGoogleTasks, 
  createGoogleTask, 
  fetchRecentGmailMessages,
  fetchGoogleChatSpaces,
  sendGoogleChatMessage,
  GoogleTaskItem,
  GoogleCalendarEventItem,
  GmailMessageSummary
} from '../utils/googleWorkspace';
import { useAuth } from '../context/AuthContext';
import { subscribeToMessages, sendMessageToFirestore } from '../utils/firebaseService';
import { CATEGORY_CONFIG, formatDateToYMD, formatReadableDate } from '../utils/calendarUtils';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEventFromAI?: (event: Omit<CalendarEvent, 'id'>) => void;
  onImportGoogleTaskToBacklog?: (taskTitle: string) => void;
  onSyncGoogleTasks?: (tasks: GoogleTaskItem[]) => void;
  onMessagesUpdated?: (messages: any[]) => void;
  onChatRead?: () => void;
  initialTab?: 'ai_logger' | 'calendar' | 'tasks' | 'gmail' | 'chat';
  selectedDate: string;
}

export interface GmailInsightItem {
  id: string;
  sourceEmailId: string;
  subject: string;
  sender: string;
  importance: 'high' | 'medium' | 'low';
  category: 'action_required' | 'appointment' | 'deadline' | 'reservation' | 'reminder';
  summary: string;
  suggestedEvent?: {
    title: string;
    startDate: string;
    startTime?: string;
    category: EventCategory;
    notes?: string;
  } | null;
  suggestedTask?: string;
}

interface SharedChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  source: 'app' | 'google_chat';
}

const LOCAL_CHAT_KEY = 'duosync_shared_chat_messages';

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onAddEventFromAI,
  onImportGoogleTaskToBacklog,
  onSyncGoogleTasks,
  onMessagesUpdated,
  onChatRead,
  initialTab,
  selectedDate,
}) => {
  const { currentUser, partnerUser, currentHub } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'ai_logger' | 'calendar' | 'tasks' | 'gmail' | 'chat'>('ai_logger');

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat' && onChatRead) {
      onChatRead();
    }
  }, [isOpen, activeTab, onChatRead]);
  
  // Google Auth state
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // AI Calendar Logger state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [pushToGoogleCalendarChecked, setPushToGoogleCalendarChecked] = useState(true);

  // Calendar sync state
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<GoogleCalendarEventItem[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Tasks state
  const [googleTasksList, setGoogleTasksList] = useState<GoogleTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Gmail state
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [gmailInsights, setGmailInsights] = useState<GmailInsightItem[]>([]);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [isAnalyzingEmails, setIsAnalyzingEmails] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<SharedChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CHAT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'msg-welcome',
        senderName: 'DuoSync Bot',
        senderAvatar: 'bg-stone-800',
        text: 'Welcome to your Shared Life Chat! Coordinate plans, groceries, pop-ups, and day tasks right here.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'app',
      },
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [selectedChatSpace, setSelectedChatSpace] = useState<string>('');
  const [chatNotice, setChatNotice] = useState<string | null>(null);

  // Confirmation dialog state for destructive/mutating actions per workspace skill
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Save chat to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(chatMessages));
    } catch (e) {}
  }, [chatMessages]);

  // Real-time couple messages sync across partner devices
  useEffect(() => {
    if (!currentHub?.id || currentHub.id === 'hub-admin-default') return;
    const unsub = subscribeToMessages(currentHub.id, (remoteMsgs) => {
      if (remoteMsgs.length > 0) {
        setChatMessages(remoteMsgs);
        if (onMessagesUpdated) {
          onMessagesUpdated(remoteMsgs);
        }
      }
    });
    return () => unsub();
  }, [currentHub?.id]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-load data when authenticated
  useEffect(() => {
    if (googleUser && isOpen) {
      if (activeTab === 'calendar' && googleCalendarEvents.length === 0) {
        handleLoadGoogleCalendar();
      } else if (activeTab === 'tasks' && googleTasksList.length === 0) {
        handleLoadGoogleTasks();
      } else if (activeTab === 'gmail' && gmailMessages.length === 0) {
        handleLoadGmail();
      }
    }
  }, [googleUser, activeTab, isOpen]);

  if (!isOpen) return null;

  // Handle Google Sign In
  const handleSignInGoogle = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setGoogleUser(result.user);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOutGoogle = async () => {
    await signOutGoogle();
    setGoogleUser(null);
    setGoogleCalendarEvents([]);
    setGoogleTasksList([]);
    setGmailMessages([]);
    setGmailInsights([]);
  };

  // 1. AI Calendar Logger: Log events when asked
  const handleAiParseAndLog = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiProcessing(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await fetch('/api/gemini/parse-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          referenceDate: selectedDate || formatDateToYMD(new Date()),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Gemini could not parse event');
      }

      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Failed to process with AI');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleConfirmAiEvent = async () => {
    if (!aiResult) return;

    const newEvt: Omit<CalendarEvent, 'id'> = {
      title: aiResult.title || 'AI Scheduled Activity',
      category: (aiResult.category as EventCategory) || 'other',
      emoji: aiResult.emoji || '📅',
      startDate: aiResult.startDate || selectedDate || formatDateToYMD(new Date()),
      startTime: aiResult.startTime || undefined,
      endTime: aiResult.endTime || undefined,
      locationName: aiResult.locationName || undefined,
      assignedTo: (aiResult.assignedTo as 'both' | 'him' | 'her') || 'both',
      notes: aiResult.notes || undefined,
      tasks: (aiResult.tasks || []).map((t: string, idx: number) => ({
        id: `t-ai-${Date.now()}-${idx}`,
        title: t,
        completed: false,
        assignedTo: aiResult.assignedTo || 'both',
      })),
      photoCount: 0,
      photos: [],
    };

    // If user asked to push to Google Calendar and is logged in, confirm before mutating Google Calendar
    if (pushToGoogleCalendarChecked && googleUser) {
      setConfirmDialog({
        isOpen: true,
        title: 'Add Event to Google Calendar?',
        message: `This will create "${newEvt.title}" on ${formatReadableDate(newEvt.startDate)}${
          newEvt.startTime ? ` at ${newEvt.startTime}` : ''
        } directly in your primary Google Calendar.`,
        actionLabel: 'Confirm & Log Event',
        onConfirm: async () => {
          setConfirmDialog(null);
          try {
            // Push to Google Calendar API
            const startDateTime = newEvt.startTime
              ? `${newEvt.startDate}T${newEvt.startTime}:00`
              : undefined;
            const endDateTime = newEvt.endTime
              ? `${newEvt.startDate}T${newEvt.endTime}:00`
              : startDateTime;

            await createGoogleCalendarEvent({
              summary: newEvt.title,
              description: newEvt.notes || `Scheduled via DuoSync Shared Hub`,
              start: startDateTime ? { dateTime: new Date(startDateTime).toISOString() } : { date: newEvt.startDate },
              end: endDateTime ? { dateTime: new Date(endDateTime).toISOString() } : { date: newEvt.startDate },
              location: newEvt.locationName,
            });
          } catch (e) {
            console.warn('Could not push to Google Calendar:', e);
          }
          if (onAddEventFromAI) {
            onAddEventFromAI(newEvt);
          }
          setAiResult(null);
          setAiPrompt('');
          onClose();
        },
      });
    } else {
      if (onAddEventFromAI) {
        onAddEventFromAI(newEvt);
      }
      setAiResult(null);
      setAiPrompt('');
      onClose();
    }
  };

  // 2. Load Google Calendar Events
  const handleLoadGoogleCalendar = async () => {
    setIsLoadingCalendar(true);
    try {
      const items = await fetchGoogleCalendarEvents();
      setGoogleCalendarEvents(items);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Import Google Calendar event into Hub
  const handleImportCalendarEvent = (item: GoogleCalendarEventItem) => {
    const startDateRaw = item.start?.date || item.start?.dateTime?.split('T')[0] || selectedDate;
    const startTimeRaw = item.start?.dateTime ? item.start.dateTime.split('T')[1]?.slice(0, 5) : undefined;
    const endTimeRaw = item.end?.dateTime ? item.end.dateTime.split('T')[1]?.slice(0, 5) : undefined;

    const newEvt: Omit<CalendarEvent, 'id'> = {
      title: item.summary || 'Google Calendar Event',
      category: 'other',
      emoji: '📅',
      startDate: startDateRaw,
      startTime: startTimeRaw,
      endTime: endTimeRaw,
      locationName: item.location,
      assignedTo: 'both',
      notes: item.description ? `Imported from Google Calendar:\n${item.description}` : 'Imported from Google Calendar',
      tasks: [],
      photoCount: 0,
      photos: [],
    };

    if (onAddEventFromAI) {
      onAddEventFromAI(newEvt);
    }
  };

  // 3. Load Google Tasks
  const handleLoadGoogleTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const tasks = await fetchGoogleTasks();
      setGoogleTasksList(tasks);
      if (onSyncGoogleTasks) {
        onSyncGoogleTasks(tasks);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleCreateNewGoogleTask = async () => {
    if (!newTaskTitle.trim()) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Create Task in Google Tasks?',
      message: `Add "${newTaskTitle.trim()}" to your Google Tasks list?`,
      actionLabel: 'Create Task',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await createGoogleTask(newTaskTitle.trim());
          setNewTaskTitle('');
          handleLoadGoogleTasks();
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  // 4. Gmail Loading & Gemini Analysis
  const handleLoadGmail = async () => {
    setIsLoadingGmail(true);
    try {
      const messages = await fetchRecentGmailMessages(12);
      setGmailMessages(messages);

      // Immediately run Gemini intelligence analysis
      setIsAnalyzingEmails(true);
      const res = await fetch('/api/gemini/analyze-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSnippets: messages.map((m) => ({
            id: m.id,
            subject: m.subject,
            from: m.from,
            date: m.date,
            snippet: m.snippet,
          })),
          referenceDate: selectedDate || formatDateToYMD(new Date()),
        }),
      });

      if (res.ok) {
        const insights = await res.json();
        setGmailInsights(insights);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoadingGmail(false);
      setIsAnalyzingEmails(false);
    }
  };

  // 5. Chat functionality
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const textToSend = chatInput.trim();
    const newMsg: SharedChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: currentUser?.name || 'Me',
      senderAvatar: currentUser?.avatarColor || 'bg-purple-600',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'app',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // Write through to Firestore for real-time couple sync
    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      sendMessageToFirestore(currentHub.id, newMsg).catch(console.warn);
    }

    // If Google Chat space selected and user is signed in, send to Google Chat
    if (googleUser && selectedChatSpace) {
      try {
        await sendGoogleChatMessage(selectedChatSpace, textToSend);
      } catch (err: any) {
        setChatNotice(
          'Message saved to your shared hub! Note: Google Chat API requires a Workspace organization app configuration.'
        );
        setTimeout(() => setChatNotice(null), 5000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-2xl max-w-4xl w-full border border-[#e4ded5] dark:border-[#2d3139] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#e4ded5] dark:border-[#2d3139] bg-[#f5f1e8] dark:bg-[#202329] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
                <span>Google Workspace & AI Intelligence Hub</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Log events with Gemini, sync Google Calendar & Tasks backlog, scan Gmail, and chat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Auth Status pill */}
            {googleUser ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 text-xs font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">{googleUser.email || googleUser.displayName}</span>
                  <span className="sm:hidden">Connected</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOutGoogle}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg text-xs"
                  title="Disconnect Google account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSignInGoogle}
                disabled={isSigningIn}
                className="gsi-material-button inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#252830] border border-[#e4ded5] dark:border-[#353943] text-stone-800 dark:text-stone-200 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-[#2e323c] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-stone-100/80 dark:bg-[#1f2229] border-b border-[#e4ded5] dark:border-[#2d3139] overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ai_logger')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'ai_logger'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-[#282c35]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Calendar Logger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-[#282c35]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Google Calendar</span>
            {googleCalendarEvents.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/80 text-white">
                {googleCalendarEvents.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-[#282c35]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Google Tasks Backlog</span>
            {googleTasksList.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/80 text-white">
                {googleTasksList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'gmail'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-[#282c35]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail Intelligence</span>
            {gmailInsights.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/80 text-white">
                {gmailInsights.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-[#282c35]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Shared Life Chat</span>
          </button>
        </div>

        {authError && (
          <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: AI CALENDAR LOGGER */}
          {activeTab === 'ai_logger' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border border-purple-200 dark:border-purple-900/60">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Ask Gemini to Log Events & Schedule Your Day
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                      Simply type in natural language (e.g. <em>"Pop-up market at Riverwalk Saturday from 9am to 3pm, booth fee $100, pack tables and charge Square"</em> or <em>"Dinner date with partner this Friday at 7pm at Bistro Bella"</em>).
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Tell Gemini what you want to schedule..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-purple-600 font-sans"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushToGoogleCalendarChecked}
                        onChange={(e) => setPushToGoogleCalendarChecked(e.target.checked)}
                        className="rounded border-stone-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span>Also push to Google Calendar if signed in</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAiParseAndLog}
                      disabled={isAiProcessing || !aiPrompt.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isAiProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini is parsing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate & Preview Event</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {aiError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">
                    {aiError}
                  </p>
                )}
              </div>

              {/* AI Parsed Event Result Preview Card */}
              {aiResult && (
                <div className="p-4 rounded-xl bg-white dark:bg-[#202329] border border-purple-300 dark:border-purple-800/80 shadow-md space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e4ded5] dark:border-[#2d3139]">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{aiResult.emoji || '📅'}</span>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {aiResult.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          {formatReadableDate(aiResult.startDate)} · {aiResult.startTime ? `${aiResult.startTime}` : 'All Day'} {aiResult.endTime ? `– ${aiResult.endTime}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 capitalize">
                      {aiResult.category}
                    </span>
                  </div>

                  {aiResult.locationName && (
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      📍 <strong>Location:</strong> {aiResult.locationName}
                    </p>
                  )}

                  {aiResult.notes && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-[#1a1d22] p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800 italic">
                      "{aiResult.notes}"
                    </p>
                  )}

                  {aiResult.tasks && aiResult.tasks.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                        Extracted Tasks Checklist:
                      </p>
                      <div className="space-y-1">
                        {aiResult.tasks.map((taskStr: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{taskStr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAiResult(null)}
                      className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAiEvent}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log into Calendar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e4ded5] dark:border-[#2d3139]">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Google Calendar Integration
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Import events into DuoSync or push hub activities directly to your Google Calendar.
                  </p>
                </div>
                {googleUser && (
                  <button
                    type="button"
                    onClick={handleLoadGoogleCalendar}
                    disabled={isLoadingCalendar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] text-xs font-semibold hover:bg-stone-100 dark:hover:bg-[#252830] cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                )}
              </div>

              {!googleUser ? (
                <div className="p-8 text-center bg-stone-50 dark:bg-[#202329] rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <CalendarIcon className="w-10 h-10 text-blue-500 mx-auto" />
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    Connect your Google account to sync your Google Calendar events.
                  </p>
                  <button
                    type="button"
                    onClick={handleSignInGoogle}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Sign in with Google
                  </button>
                </div>
              ) : isLoadingCalendar ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                  <span>Loading Google Calendar events...</span>
                </div>
              ) : googleCalendarEvents.length === 0 ? (
                <p className="text-xs text-stone-500 italic p-4 text-center">
                  No upcoming Google Calendar events found in your primary calendar.
                </p>
              ) : (
                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                  {googleCalendarEvents.map((item) => {
                    const dateStr = item.start?.date || item.start?.dateTime?.split('T')[0] || '';
                    const timeStr = item.start?.dateTime ? item.start.dateTime.split('T')[1]?.slice(0, 5) : '';
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white dark:bg-[#202329] border border-stone-200 dark:border-[#2d3139] flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-blue-300 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-stone-900 dark:text-stone-100 truncate">
                            {item.summary || 'Untitled Event'}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {dateStr ? formatReadableDate(dateStr) : ''} {timeStr ? `at ${timeStr}` : ''}
                            {item.location ? ` · ${item.location}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleImportCalendarEvent(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 text-xs font-semibold cursor-pointer shrink-0"
                          title="Import into DuoSync Hub calendar"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Hub</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GOOGLE TASKS BACKLOG */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e4ded5] dark:border-[#2d3139]">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Google Tasks Backlog Sync
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Google Tasks immediately appear in your day schedule backlog bucket alongside unfinished checklist tasks!
                  </p>
                </div>
                {googleUser && (
                  <button
                    type="button"
                    onClick={handleLoadGoogleTasks}
                    disabled={isLoadingTasks}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] text-xs font-semibold hover:bg-stone-100 dark:hover:bg-[#252830] cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTasks ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                )}
              </div>

              {!googleUser ? (
                <div className="p-8 text-center bg-stone-50 dark:bg-[#202329] rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <CheckSquare className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    Sign in with Google to sync your Google Tasks directly into your daily backlog bucket.
                  </p>
                  <button
                    type="button"
                    onClick={handleSignInGoogle}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Create New Task Form */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a new Google Task..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateNewGoogleTask();
                      }}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewGoogleTask}
                      disabled={!newTaskTitle.trim()}
                      className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      + Add Task
                    </button>
                  </div>

                  {isLoadingTasks ? (
                    <div className="p-8 text-center text-xs text-stone-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                      <span>Fetching Google Tasks...</span>
                    </div>
                  ) : googleTasksList.length === 0 ? (
                    <p className="text-xs text-stone-500 italic p-4 text-center">
                      No pending tasks in your Google Tasks account.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                      {googleTasksList.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-lg bg-white dark:bg-[#202329] border border-stone-200 dark:border-[#2d3139] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-stone-800 dark:text-stone-200 block truncate">
                              {t.title}
                            </span>
                            {t.due && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                                Due: {formatReadableDate(t.due.split('T')[0])}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (onImportGoogleTaskToBacklog) {
                                onImportGoogleTaskToBacklog(t.title);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-semibold cursor-pointer shrink-0"
                            title="Add directly into today's schedule checklist"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Add to Day</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GMAIL INTELLIGENCE */}
          {activeTab === 'gmail' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e4ded5] dark:border-[#2d3139]">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Gmail Intelligence & Forgotten Action Items
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Gemini analyzes your incoming emails for things you need to do, upcoming reservations, and deadlines you might have forgotten.
                  </p>
                </div>
                {googleUser && (
                  <button
                    type="button"
                    onClick={handleLoadGmail}
                    disabled={isLoadingGmail}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] text-xs font-semibold hover:bg-stone-100 dark:hover:bg-[#252830] cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                    <span>Scan Gmail</span>
                  </button>
                )}
              </div>

              {!googleUser ? (
                <div className="p-8 text-center bg-stone-50 dark:bg-[#202329] rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <Mail className="w-10 h-10 text-rose-500 mx-auto" />
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    Sign in with Google to allow Gemini to identify important reminders and actionable items from your Gmail.
                  </p>
                  <button
                    type="button"
                    onClick={handleSignInGoogle}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Sign in with Google
                  </button>
                </div>
              ) : isLoadingGmail ? (
                <div className="p-8 text-center text-xs text-stone-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                  <p className="font-semibold">Reading recent inbox emails & running Gemini intelligence analysis...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gmailInsights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Actionable Items Extracted by Gemini ({gmailInsights.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {gmailInsights.map((ins, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-stone-900 dark:text-stone-100 block">
                                  {ins.summary}
                                </span>
                                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                                  Source email: "{ins.subject}" · {ins.sender}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                ins.importance === 'high'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-200 text-amber-900'
                              }`}>
                                {ins.importance} Priority
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
                              {ins.suggestedEvent && onAddEventFromAI && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onAddEventFromAI({
                                      title: ins.suggestedEvent!.title,
                                      category: ins.suggestedEvent!.category || 'other',
                                      startDate: ins.suggestedEvent!.startDate || selectedDate,
                                      startTime: ins.suggestedEvent!.startTime,
                                      notes: `From Email: ${ins.subject}\n${ins.suggestedEvent!.notes || ''}`,
                                      assignedTo: 'both',
                                      tasks: [],
                                      photoCount: 0,
                                      photos: [],
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[11px] font-semibold cursor-pointer"
                                >
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>Log to Calendar</span>
                                </button>
                              )}

                              {ins.suggestedTask && onImportGoogleTaskToBacklog && (
                                <button
                                  type="button"
                                  onClick={() => onImportGoogleTaskToBacklog(ins.suggestedTask!)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-[#202329] border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-[11px] font-semibold hover:bg-stone-50 cursor-pointer"
                                >
                                  <CheckSquare className="w-3 h-3 text-amber-600" />
                                  <span>Add to Task Backlog</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Email previews */}
                  <div className="space-y-1.5 pt-2">
                    <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-mono">
                      Recent Inbox Messages ({gmailMessages.length})
                    </h4>
                    {gmailMessages.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-[#202329] border border-stone-200 dark:border-[#2d3139] text-xs"
                      >
                        <div className="flex items-center justify-between text-stone-800 dark:text-stone-200 font-semibold">
                          <span className="truncate">{m.subject}</span>
                          <span className="text-[10px] text-stone-400 font-normal shrink-0 ml-2">{m.date.slice(0, 16)}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {m.from} — {m.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SHARED LIFE CHAT & GOOGLE CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e4ded5] dark:border-[#2d3139]">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Shared Life Chat</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Send messages regarding your shared life, chores, and household plans.
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {partnerUser ? `Chatting with ${partnerUser.name}` : 'Shared Space'}
                </span>
              </div>

              {chatNotice && (
                <div className="p-2 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 text-xs border border-amber-200">
                  {chatNotice}
                </div>
              )}

              {/* Chat Messages Timeline */}
              <div className="h-64 sm:h-72 overflow-y-auto p-3 rounded-xl bg-stone-100/60 dark:bg-[#16181d] border border-stone-200 dark:border-stone-800 space-y-2.5">
                {chatMessages.map((msg) => {
                  const isMe = msg.senderName === currentUser?.name || msg.senderName === 'Me';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-stone-400">
                        <span className="font-semibold text-stone-600 dark:text-stone-300">{msg.senderName}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                          isMe
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-tr-xs'
                            : 'bg-white dark:bg-[#252830] text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  placeholder="Type a message to your partner about shared life..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* User Confirmation Dialog for Destructive / Mutating operations */}
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-[#202329] rounded-2xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-3">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {confirmDialog.title}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 cursor-pointer"
                >
                  {confirmDialog.actionLabel}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
