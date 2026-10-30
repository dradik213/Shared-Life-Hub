import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart,
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
  UserCheck,
  Sliders,
  Settings,
  ShieldCheck,
  Edit3,
  Trash2,
  RotateCcw,
  Store,
  UtensilsCrossed,
  Wrench,
  Luggage,
  ShoppingCart,
  Users,
  UserPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package
} from 'lucide-react';
import { InventoryManager } from './InventoryManager';
import { CalendarEvent, EventCategory, PlanTemplate } from '../types/calendar';
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
import { CATEGORY_CONFIG, formatDateToYMD, formatReadableDate, formatTimeRange, formatUsTime } from '../utils/calendarUtils';

export type UnifiedWorkspaceTab = 
  | 'inventory'
  | 'templates' 
  | 'admin' 
  | 'gemini' 
  | 'tasks' 
  | 'calendar' 
  | 'chat' 
  | 'gmail';

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

interface UnifiedWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: UnifiedWorkspaceTab;
  selectedDate: string;
  // Templates Management props
  templates: PlanTemplate[];
  onUpdateTemplate: (template: PlanTemplate) => void;
  onCreateTemplate: (template: PlanTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onReorderTemplates?: (templates: PlanTemplate[]) => void;
  onResetTemplates: () => void;
  onClearAllEventsAndStays?: () => void;
  onLoadNovemberTestData?: () => void;
  onOpenInviteModal?: () => void;
  onOpenProfileModal?: () => void;
  // AI & Google Workspace props
  onAddEventFromAI?: (event: Omit<CalendarEvent, 'id'>) => void;
  onImportGoogleTaskToBacklog?: (taskTitle: string) => void;
  onSyncGoogleTasks?: (tasks: GoogleTaskItem[]) => void;
  onMessagesUpdated?: (messages: any[]) => void;
  onChatRead?: () => void;
  onTemplatesViewed?: () => void;
  onPartnerInviteViewed?: () => void;
  unreadChatCount?: number;
  tabNotifications?: {
    templates?: number;
    admin?: number;
    gemini?: number;
    tasks?: number;
    calendar?: number;
    gmail?: number;
    chat?: number;
  };
}

export const UnifiedWorkspaceModal: React.FC<UnifiedWorkspaceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'templates',
  selectedDate,
  templates,
  onUpdateTemplate,
  onCreateTemplate,
  onDeleteTemplate,
  onReorderTemplates,
  onResetTemplates,
  onClearAllEventsAndStays,
  onLoadNovemberTestData,
  onOpenInviteModal,
  onOpenProfileModal,
  onAddEventFromAI,
  onImportGoogleTaskToBacklog,
  onSyncGoogleTasks,
  onMessagesUpdated,
  onChatRead,
  onTemplatesViewed,
  onPartnerInviteViewed,
  unreadChatCount = 0,
  tabNotifications,
}) => {
  const { 
    currentUser, 
    partnerUser, 
    currentHub, 
    coupleViewLabel, 
    partner1Label, 
    partner2Label, 
    user1Theme, 
    user2Theme, 
    updateHubName,
    hubs,
    switchHub 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<UnifiedWorkspaceTab>(initialTab);

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

  useEffect(() => {
    if (isOpen && activeTab === 'templates' && onTemplatesViewed) {
      onTemplatesViewed();
    }
  }, [isOpen, activeTab, onTemplatesViewed]);

  useEffect(() => {
    if (isOpen && activeTab === 'admin' && onPartnerInviteViewed) {
      onPartnerInviteViewed();
    }
  }, [isOpen, activeTab, onPartnerInviteViewed]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // -------------------------------------------------------------
  // Template & Admin State
  // -------------------------------------------------------------
  const [editingTemplate, setEditingTemplate] = useState<PlanTemplate | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditingHubName, setIsEditingHubName] = useState(false);
  const [hubNameDraft, setHubNameDraft] = useState(currentHub?.name || 'Shared Life Hub');
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);
  const [confirmClearChat, setConfirmClearChat] = useState<boolean>(false);

  useEffect(() => {
    if (currentHub?.name) {
      setHubNameDraft(currentHub.name);
    }
  }, [currentHub?.name]);

  const showAdminFeedback = (msg: string) => {
    setAdminFeedback(msg);
    setTimeout(() => setAdminFeedback(null), 3000);
  };

  // -------------------------------------------------------------
  // Google Workspace & AI State
  // -------------------------------------------------------------
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

  // Dialog state
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

  // Real-time couple messages sync
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
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
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

  // -------------------------------------------------------------
  // Handlers for Google Authentication & Services
  // -------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      setGoogleUser(user);
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutGoogle();
    setGoogleUser(null);
    setGoogleCalendarEvents([]);
    setGoogleTasksList([]);
    setGmailMessages([]);
    setGmailInsights([]);
  };

  const handleLoadGoogleCalendar = async () => {
    setIsLoadingCalendar(true);
    try {
      const events = await fetchGoogleCalendarEvents();
      setGoogleCalendarEvents(events);
    } catch (err: any) {
      console.warn('Failed to load Google Calendar events:', err);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleLoadGoogleTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const tasks = await fetchGoogleTasks();
      setGoogleTasksList(tasks);
      if (onSyncGoogleTasks) {
        onSyncGoogleTasks(tasks);
      }
    } catch (err: any) {
      console.warn('Failed to load Google Tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    try {
      const created = await createGoogleTask(title);
      setGoogleTasksList((prev) => [created, ...prev]);
      setNewTaskTitle('');
      if (onImportGoogleTaskToBacklog) {
        onImportGoogleTaskToBacklog(created.title);
      }
      showAdminFeedback(`Added task "${created.title}" to backlog!`);
    } catch (err) {
      console.warn('Google Tasks API not signed in, adding local backlog item:', err);
      const localTask: GoogleTaskItem = {
        id: `local-task-${Date.now()}`,
        title,
        status: 'needsAction'
      };
      const updated = [localTask, ...googleTasksList];
      setGoogleTasksList(updated);
      if (onSyncGoogleTasks) {
        onSyncGoogleTasks(updated);
      }
      setNewTaskTitle('');
      if (onImportGoogleTaskToBacklog) {
        onImportGoogleTaskToBacklog(localTask.title);
      }
      showAdminFeedback(`Added task "${localTask.title}" to backlog!`);
    }
  };

  const handleToggleTaskCompletion = (taskId: string) => {
    setGoogleTasksList((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId
          ? { ...t, status: (t.status === 'completed' ? 'needsAction' : 'completed') as 'needsAction' | 'completed' }
          : t
      );
      if (onSyncGoogleTasks) {
        onSyncGoogleTasks(updated);
      }
      return updated;
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setGoogleTasksList((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      if (onSyncGoogleTasks) {
        onSyncGoogleTasks(updated);
      }
      return updated;
    });
    showAdminFeedback('Task removed from backlog.');
  };

  const handleLoadGmail = async () => {
    setIsLoadingGmail(true);
    try {
      const msgs = await fetchRecentGmailMessages(10);
      setGmailMessages(msgs);
      generateGmailInsights(msgs);
    } catch (err: any) {
      console.warn('Failed to load Gmail messages:', err);
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const generateGmailInsights = async (msgs: GmailMessageSummary[]) => {
    setIsAnalyzingEmails(true);

    const fallbackParser = () => {
      return msgs.slice(0, 5).map((m, idx) => {
        const sub = m.subject.toLowerCase();
        let cat: GmailInsightItem['category'] = 'reminder';
        let importance: GmailInsightItem['importance'] = 'medium';

        if (sub.includes('dinner') || sub.includes('reservation') || sub.includes('restaurant')) {
          cat = 'reservation';
          importance = 'high';
        } else if (sub.includes('vet') || sub.includes('appointment') || sub.includes('doctor')) {
          cat = 'appointment';
          importance = 'high';
        } else if (sub.includes('action') || sub.includes('due') || sub.includes('pay')) {
          cat = 'action_required';
          importance = 'high';
        }

        return {
          id: `insight-${m.id}-${idx}`,
          sourceEmailId: m.id,
          subject: m.subject,
          sender: m.from,
          importance,
          category: cat,
          summary: m.snippet || 'Important update requiring joint review.',
          suggestedEvent: {
            title: m.subject.replace(/re:|fwd:/gi, '').trim(),
            startDate: selectedDate,
            startTime: '19:00',
            category: (cat === 'reservation' ? 'dinner_date' : 'other') as EventCategory,
            notes: `Extracted from email from ${m.from}. Snippet: ${m.snippet}`,
          },
          suggestedTask: `Follow up on email: "${m.subject}"`,
        };
      });
    };

    try {
      const emailSnippets = msgs.slice(0, 8).map((m) => ({
        id: m.id,
        subject: m.subject,
        from: m.from,
        date: m.date,
        snippet: m.snippet,
      }));

      const res = await fetch('/api/gemini/analyze-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSnippets,
          referenceDate: selectedDate,
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned non-ok status');
      }

      const parsed = await res.json();
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGmailInsights(parsed);
      } else {
        setGmailInsights(fallbackParser());
      }
    } catch (err) {
      console.warn('Backend email analysis failed, using fallback parser:', err);
      setGmailInsights(fallbackParser());
    } finally {
      setIsAnalyzingEmails(false);
    }
  };

  // AI Calendar Logger prompt execution
  const handleRunAiLogger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiProcessing(true);
    setAiError(null);
    setAiResult(null);

    try {
      const response = await fetch('/api/gemini/parse-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          currentDate: selectedDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const parsed = await response.json();
      setAiResult(parsed);

      if (pushToGoogleCalendarChecked && googleUser) {
        try {
          const sDate = parsed.startDate || selectedDate;
          const sTime = parsed.startTime || '18:00';
          const eTime = parsed.endTime || '20:00';
          await createGoogleCalendarEvent({
            summary: parsed.title,
            description: parsed.notes || 'Logged via DuoSync AI Assistant',
            start: { dateTime: `${sDate}T${sTime}:00` },
            end: { dateTime: `${sDate}T${eTime}:00` },
            location: parsed.locationName,
          });
        } catch (calErr) {
          console.warn('Failed to sync to Google Calendar:', calErr);
        }
      }
    } catch (err: any) {
      console.warn('AI Parsing Error:', err);
      // Clean fallback parser for smooth user experience
      const lower = aiPrompt.toLowerCase();
      let cat: EventCategory = 'other';
      if (lower.includes('dinner') || lower.includes('eat') || lower.includes('restaurant')) cat = 'dinner_date';
      else if (lower.includes('market') || lower.includes('fair') || lower.includes('bazaar')) cat = 'market';
      else if (lower.includes('dog') || lower.includes('cat') || lower.includes('vet')) cat = 'pets';
      else if (lower.includes('grocery') || lower.includes('trader') || lower.includes('store')) cat = 'grocery_errand';
      else if (lower.includes('clean') || lower.includes('fix') || lower.includes('paint')) cat = 'maintenance';

      const fallbackResult = {
        title: aiPrompt.slice(0, 40),
        category: cat,
        startDate: selectedDate,
        startTime: '18:30',
        endTime: '20:00',
        assignedTo: 'both' as const,
        notes: `Input: "${aiPrompt}"`,
        tasks: ['Coordinate with partner', 'Confirm arrival time'],
      };
      setAiResult(fallbackResult);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyAiEvent = () => {
    if (!aiResult || !onAddEventFromAI) return;
    onAddEventFromAI({
      title: aiResult.title || 'New Shared Activity',
      category: aiResult.category || 'other',
      startDate: aiResult.startDate || selectedDate,
      startTime: aiResult.startTime,
      endTime: aiResult.endTime,
      assignedTo: aiResult.assignedTo || 'both',
      notes: aiResult.notes,
      locationName: aiResult.locationName,
      tasks: (aiResult.tasks || []).map((t: string, idx: number) => ({
        id: `task-ai-${Date.now()}-${idx}`,
        title: t,
        completed: false,
        assignedTo: 'both',
      })),
    });
    showAdminFeedback(`Added "${aiResult.title}" to shared calendar!`);
    setAiResult(null);
    setAiPrompt('');
  };

  // Send message in couple chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: SharedChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: currentUser?.name || 'You',
      senderAvatar: currentUser?.avatarColor || 'bg-purple-600',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'app',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    if (currentHub?.id && currentHub.id !== 'hub-admin-default') {
      try {
        await sendMessageToFirestore(currentHub.id, newMsg as any);
      } catch (err) {
        console.warn('Failed to sync chat message:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // Template CRUD Handlers
  // -------------------------------------------------------------
  const handleMoveTemplate = (idx: number, delta: number) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= templates.length) return;
    const reordered = [...templates];
    const item = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = item;
    if (onReorderTemplates) {
      onReorderTemplates(reordered);
    }
    showAdminFeedback(`Reordered "${item.name}".`);
  };

  const handleStartCreateTemplate = () => {
    const newTmpl: PlanTemplate = {
      id: `tmpl-${Date.now()}`,
      name: 'New Custom Template',
      emoji: '⭐',
      category: 'other',
      defaultTitle: 'New Shared Activity',
      defaultStartTime: '10:00',
      defaultEndTime: '12:00',
      defaultLocationName: '',
      assignedTo: 'both',
      defaultTasks: ['First preparation checklist item'],
      defaultNotes: '',
    };
    setEditingTemplate(newTmpl);
    setIsCreatingTemplate(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    if (isCreatingTemplate) {
      const templateToCreate: PlanTemplate = {
        ...editingTemplate,
        createdBy: currentUser?.id,
        createdAt: new Date().toISOString(),
      };
      onCreateTemplate(templateToCreate);
      showAdminFeedback(`Created "${editingTemplate.name}" template successfully.`);
    } else {
      onUpdateTemplate(editingTemplate);
      showAdminFeedback(`Updated "${editingTemplate.name}" template.`);
    }
    setEditingTemplate(null);
    setIsCreatingTemplate(false);
  };

  const handleAddTaskToEditing = () => {
    if (!newTaskInput.trim() || !editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      defaultTasks: [...editingTemplate.defaultTasks, newTaskInput.trim()],
    });
    setNewTaskInput('');
  };

  const handleRemoveTaskFromEditing = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      defaultTasks: editingTemplate.defaultTasks.filter((_, i) => i !== index),
    });
  };

  const handleSaveHubName = () => {
    if (!hubNameDraft.trim()) return;
    updateHubName(hubNameDraft.trim());
    setIsEditingHubName(false);
    showAdminFeedback('Hub name updated successfully.');
  };

  // Tab-specific notification counts (strictly authentic notifications, default 0)
  const notificationCounts = {
    templates: tabNotifications?.templates ?? 0,
    admin: tabNotifications?.admin ?? 0,
    gemini: tabNotifications?.gemini ?? 0,
    tasks: tabNotifications?.tasks ?? 0,
    calendar: tabNotifications?.calendar ?? 0,
    gmail: tabNotifications?.gmail ?? (gmailInsights.length > 0 ? gmailInsights.length : 0),
    chat: tabNotifications?.chat ?? unreadChatCount,
  };

  // Tabs config - CHAT IS THE FINAL OPTION
  const TABS: { id: UnifiedWorkspaceTab; label: string; icon: any; badge?: number }[] = [
    { id: 'inventory', label: 'Inventory', icon: Package, badge: 0 },
    { id: 'templates', label: 'Templates', icon: Sliders, badge: notificationCounts.templates },
    { id: 'admin', label: 'Admin & Hub', icon: Settings, badge: notificationCounts.admin },
    { id: 'gemini', label: 'Gemini AI', icon: Sparkles, badge: notificationCounts.gemini },
    { id: 'tasks', label: 'Tasks & Backlog', icon: CheckSquare, badge: notificationCounts.tasks },
    { id: 'calendar', label: 'Calendar Sync', icon: CalendarIcon, badge: notificationCounts.calendar },
    { id: 'gmail', label: 'Gmail Insights', icon: Mail, badge: notificationCounts.gmail },
    { id: 'chat', label: 'Partner Chat', icon: MessageSquare, badge: notificationCounts.chat },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[92vh] bg-white dark:bg-[#181a1e] border-0 sm:border border-[#e4ded5] dark:border-[#2d3139] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#e5e0d8] dark:border-[#2d3139] bg-stone-50/90 dark:bg-[#202329]/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-xs">
              <Heart className="w-4 h-4 fill-white text-white drop-shadow-xs" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>{currentHub?.name || 'Shared Life Hub'}</span>
                <span className="text-[11px] font-sans font-normal px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  Workspace
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {googleUser ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">{googleUser.email || googleUser.displayName}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#e2ddd5] dark:border-[#353943] bg-white dark:bg-[#252830] hover:bg-stone-100 dark:hover:bg-[#2e323c] text-stone-800 dark:text-stone-200 transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{isSigningIn ? 'Connecting...' : 'Connect Google'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-[#2a2e36] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Navigation Pill Buttons with Independent Notification Badges */}
        <div className="px-4 sm:px-6 py-2 border-b border-[#e5e0d8] dark:border-[#2d3139] bg-stone-100/60 dark:bg-[#1a1d22] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'chat') {
                      onChatRead?.();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'bg-white dark:bg-[#252830] text-stone-700 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-[#2e323c] border border-[#e4ded5] dark:border-[#353943]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold shadow-2xs">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Feedback banner */}
          {adminFeedback && (
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 animate-in fade-in shrink-0">
              {adminFeedback}
            </span>
          )}
        </div>

        {/* Modal Main Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ========================================================
              TAB: INVENTORY & BARCODES
             ======================================================== */}
          {activeTab === 'inventory' && (
            <InventoryManager />
          )}

          {/* ========================================================
              TAB 1: TEMPLATES
             ======================================================== */}
          {activeTab === 'templates' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e5e0d8] dark:border-[#2d3139]">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Activity & Routine Templates
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Create reusable event blueprints for recurring dates, markets, chores, and packing routines.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onResetTemplates}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#252830] hover:bg-stone-100 dark:hover:bg-[#2e323c] text-stone-700 dark:text-stone-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartCreateTemplate}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Template</span>
                  </button>
                </div>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {templates.map((tmpl, idx) => {
                  const cfg = CATEGORY_CONFIG[tmpl.category] || CATEGORY_CONFIG.other;
                  return (
                    <div
                      key={tmpl.id}
                      className="rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#1f2229] p-4 shadow-2xs flex flex-col justify-between hover:border-stone-400 dark:hover:border-stone-600 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl select-none">{tmpl.emoji}</span>
                            <div>
                              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                                {tmpl.name}
                              </h4>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cfg.badgeBg} ${cfg.textColor} border ${cfg.borderColor}`}>
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveTemplate(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 cursor-pointer"
                              title="Move up"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveTemplate(idx, 1)}
                              disabled={idx === templates.length - 1}
                              className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 cursor-pointer"
                              title="Move down"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 mt-2">
                          Default: "{tmpl.defaultTitle}"
                        </p>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {tmpl.defaultStartTime ? formatUsTime(tmpl.defaultStartTime) : 'Anytime'} – {tmpl.defaultEndTime ? formatUsTime(tmpl.defaultEndTime) : 'End'}
                          </span>
                        </div>

                        {tmpl.defaultTasks && tmpl.defaultTasks.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-[#2d3139]">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1">
                              Checklist ({tmpl.defaultTasks.length})
                            </p>
                            <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
                              {tmpl.defaultTasks.slice(0, 3).map((task, tIdx) => (
                                <li key={tIdx} className="truncate flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />
                                  <span>{task}</span>
                                </li>
                              ))}
                              {tmpl.defaultTasks.length > 3 && (
                                <li className="text-[10px] italic text-stone-400">
                                  +{tmpl.defaultTasks.length - 3} more items
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#2d3139] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTemplate({
                              ...tmpl,
                              defaultTasks: [...tmpl.defaultTasks],
                            });
                            setIsCreatingTemplate(false);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 hover:underline cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Template</span>
                        </button>
                        {confirmDeleteTemplateId === tmpl.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTemplate(tmpl.id);
                                setConfirmDeleteTemplateId(null);
                                showAdminFeedback(`Deleted "${tmpl.name}".`);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Confirm Delete?
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTemplateId(null)}
                              className="px-1 text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTemplateId(tmpl.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: ADMIN & HUB SETTINGS
             ======================================================== */}
          {activeTab === 'admin' && (
            <div className="space-y-6 max-w-4xl">
              {/* Hub Profile & Name Setting */}
              <div className="p-4 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#1f2229] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      Hub Identity & Name
                    </h4>
                  </div>
                  {!isEditingHubName ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingHubName(true)}
                      className="text-xs font-semibold text-purple-600 hover:underline cursor-pointer"
                    >
                      Edit Name
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveHubName}
                        className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingHubName(false)}
                        className="text-xs text-stone-500 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {isEditingHubName ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={hubNameDraft}
                      onChange={(e) => setHubNameDraft(e.target.value)}
                      placeholder="e.g. Dustin & Sarah's Life Hub"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] text-xs font-semibold text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    {currentHub?.name || 'Shared Life Hub'}
                  </p>
                )}
                {/* Active Hub Switcher: Calls AuthContext switchHub so App updates currentHub immediately */}
                {hubs && hubs.length > 0 && (
                  <div className="pt-2.5 border-t border-stone-200/70 dark:border-stone-800/70 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Switch Active Hub:
                    </span>
                    <select
                      value={currentHub?.id || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          switchHub(e.target.value);
                          showAdminFeedback('Switched active hub.');
                        }
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] text-stone-900 dark:text-stone-100 font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {hubs.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} {h.id === currentHub?.id ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  This hub name appears at the top left of your calendar and on shared invite links.
                </p>
              </div>

              {/* Partner Invite & Code */}
              <div className="p-4 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#1f2229] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-500" />
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span>{(!partnerUser || (currentHub?.members && currentHub.members.length < 2)) ? 'Partner Invite (1)' : 'Partner & Members'}</span>
                      {(!partnerUser || (currentHub?.members && currentHub.members.length < 2)) && (
                        <span className="text-[10px] px-1.5 py-0.2 font-bold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
                          1 pending
                        </span>
                      )}
                    </h4>
                  </div>
                  {onOpenInviteModal && (
                    <button
                      type="button"
                      onClick={onOpenInviteModal}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Manage Invite</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-[#252830] border border-stone-200 dark:border-[#2d3139]">
                    <div className={`w-7 h-7 rounded-full ${currentUser?.avatarColor || 'bg-purple-600'} text-white flex items-center justify-center font-bold text-xs`}>
                      {currentUser?.name[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-stone-900 dark:text-stone-100">{currentUser?.name} (You)</p>
                      <p className="text-[10px] text-stone-500">{currentUser?.email}</p>
                    </div>
                  </div>

                  {partnerUser ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-[#252830] border border-stone-200 dark:border-[#2d3139]">
                      <div className={`w-7 h-7 rounded-full ${partnerUser.avatarColor || 'bg-emerald-500'} text-white flex items-center justify-center font-bold text-xs`}>
                        {partnerUser.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-stone-900 dark:text-stone-100">{partnerUser.name} (Partner)</p>
                        <p className="text-[10px] text-stone-500">{partnerUser.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-300 flex items-center justify-between gap-3">
                      <span>No partner joined yet. Share your Hub Invite Code:</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentHub?.inviteCode) {
                            navigator.clipboard.writeText(currentHub.inviteCode);
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }
                        }}
                        className="font-mono font-bold bg-white dark:bg-[#1a1d22] px-2 py-1 rounded border border-purple-300 dark:border-purple-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{currentHub?.inviteCode || 'DUO-1234'}</span>
                        <Copy className="w-3 h-3 text-purple-600" />
                        {copiedCode && <span className="text-[10px] text-emerald-600">Copied!</span>}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Shared Color Scheme */}
              <div className="p-4 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#1f2229] shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    Shared Color Scheme & Themes
                  </h4>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Partner badges and schedule filters use coordinated theme tokens to maintain harmonious contrast.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg border border-[#e4ded5] dark:border-[#2d3139] bg-stone-50 dark:bg-[#252830]">
                    <p className="text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">{partner1Label} Theme</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${user1Theme.badgeBg}`}>
                        {partner1Label} Badge
                      </span>
                      <span className="text-[10px] text-stone-500">Rose / Warm Tone</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#e4ded5] dark:border-[#2d3139] bg-stone-50 dark:bg-[#252830]">
                    <p className="text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">{partner2Label} Theme</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${user2Theme.badgeBg}`}>
                        {partner2Label} Badge
                      </span>
                      <span className="text-[10px] text-stone-500">Indigo / Cool Tone</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Reset & Hygiene */}
              {onClearAllEventsAndStays && (
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
                  <h4 className="font-bold text-xs text-rose-900 dark:text-rose-200">
                    Data Hygiene & Reset
                  </h4>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400">
                    Clear scheduled calendar events and overnight stays for a fresh start. This cannot be undone.
                  </p>
                  {!confirmClearData ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClearData(true)}
                      className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      Clear Calendar Events & Stays
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClearAllEventsAndStays();
                          setConfirmClearData(false);
                          showAdminFeedback('Calendar events and stays cleared.');
                        }}
                        className="text-xs font-bold px-2.5 py-1 rounded bg-rose-700 text-white cursor-pointer"
                      >
                        Confirm Wipe
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearData(false)}
                        className="text-xs text-stone-600 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* November Test Dataset Loader */}
              {onLoadNovemberTestData && (
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-xs text-purple-950 dark:text-purple-200">
                        November Test Schedule (Dustin & Katherine)
                      </h4>
                      <p className="text-[11px] text-purple-700 dark:text-purple-400">
                        Loads the complete 30-day November calendar: alternating stays, 9:30 PM dog care, daily dinners, 6 weekend markets, and Thanksgiving week.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onLoadNovemberTestData();
                        showAdminFeedback('November test schedule reloaded!');
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs shrink-0 transition-colors"
                    >
                      Reload November Schedule
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 3: GEMINI AI CALENDAR LOGGER
             ======================================================== */}
          {activeTab === 'gemini' && (
            <div className="space-y-5 max-w-4xl">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Gemini Natural Language Activity Logger</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Type or paste what you and your partner are planning. Gemini extracts the time, category, tasks, and location automatically.
                </p>
              </div>

              <form onSubmit={handleRunAiLogger} className="space-y-3">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Dinner date at Osteria Morini this Friday at 7pm with Sarah, need to book table and pick up flowers on the way."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#1f2229] text-xs sm:text-sm text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushToGoogleCalendarChecked}
                        onChange={(e) => setPushToGoogleCalendarChecked(e.target.checked)}
                        className="rounded accent-purple-600 cursor-pointer"
                      />
                      <span>Also sync to Google Calendar if connected</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isAiProcessing || !aiPrompt.trim()}
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAiProcessing ? 'Extracting with Gemini...' : 'Parse & Generate'}</span>
                  </button>
                </div>
              </form>

              {/* Example Prompts */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                <span className="font-semibold text-stone-600 dark:text-stone-400">Try:</span>
                {[
                  'Farmers Market Saturday at 9am to buy fresh sourdough and peaches',
                  'Vet appointment for Oliver on Tuesday at 3:30pm',
                  'Weekend getaway packing and house maintenance checklist',
                ].map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setAiPrompt(sample)}
                    className="px-2 py-1 rounded-md bg-stone-100 dark:bg-[#252830] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#2e323c] text-[11px] cursor-pointer"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>

              {/* AI Result Card */}
              {aiResult && (
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Extracted Activity Proposal</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyAiEvent}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                    >
                      + Add to Calendar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-stone-500">Title:</span>{' '}
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{aiResult.title}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Category:</span>{' '}
                      <span className="font-semibold text-stone-900 dark:text-stone-100 capitalize">{aiResult.category}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Date & Time:</span>{' '}
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {aiResult.startDate} at {aiResult.startTime ? formatUsTime(aiResult.startTime) : 'Flexible'}
                      </span>
                    </div>
                    {aiResult.locationName && (
                      <div>
                        <span className="text-stone-500">Location:</span>{' '}
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{aiResult.locationName}</span>
                      </div>
                    )}
                  </div>

                  {aiResult.tasks && aiResult.tasks.length > 0 && (
                    <div className="pt-2 border-t border-purple-200 dark:border-purple-800/80">
                      <p className="text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Suggested Checklist Tasks:
                      </p>
                      <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
                        {aiResult.tasks.map((task: string, tIdx: number) => (
                          <li key={tIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 4: TASKS & BACKLOG
             ======================================================== */}
          {activeTab === 'tasks' && (
            <div className="space-y-5 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Tasks & Shared Backlog</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Syncs directly with Google Tasks and rolls over unfinished event checklist items.
                  </p>
                </div>

                {googleUser && (
                  <button
                    type="button"
                    onClick={handleLoadGoogleTasks}
                    disabled={isLoadingTasks}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#252830] hover:bg-stone-100 dark:hover:bg-[#2e323c] text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTasks ? 'animate-spin' : ''}`} />
                    <span>Refresh Google Tasks</span>
                  </button>
                )}
              </div>

              {/* Add New Task Form */}
              <form onSubmit={handleCreateTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new task (e.g. Schedule chimney sweep)..."
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#1f2229] text-xs text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Add Task
                </button>
              </form>

              {/* Tasks List */}
              <div className="space-y-2">
                {isLoadingTasks ? (
                  <p className="text-xs text-stone-400 py-4 text-center">Loading tasks from Google Tasks...</p>
                ) : googleTasksList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-[#e4ded5] dark:border-[#2d3139] rounded-xl">
                    No active tasks found. Add a task above or connect Google Tasks.
                  </div>
                ) : (
                  googleTasksList.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#1f2229] shadow-2xs flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskCompletion(task.id)}
                          className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                            task.status === 'completed'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-400 dark:border-stone-500 bg-white dark:bg-black/40 hover:border-emerald-500'
                          }`}
                          title="Toggle completion status"
                        >
                          {task.status === 'completed' && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span className={`font-semibold truncate ${
                          task.status === 'completed' 
                            ? 'line-through opacity-60 text-stone-400 dark:text-stone-500' 
                            : 'text-stone-900 dark:text-stone-100'
                        }`}>
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.due && (
                          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                            Due: {formatReadableDate(task.due.split('T')[0])}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete backlog task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: CALENDAR SYNC
             ======================================================== */}
          {activeTab === 'calendar' && (
            <div className="space-y-5 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-purple-600" />
                    <span>Google Calendar Synchronizer</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Direct integration with Google Calendar to view upcoming events alongside DuoSync.
                  </p>
                </div>

                {googleUser && (
                  <button
                    type="button"
                    onClick={handleLoadGoogleCalendar}
                    disabled={isLoadingCalendar}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#252830] hover:bg-stone-100 dark:hover:bg-[#2e323c] text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
                    <span>Refresh Calendar</span>
                  </button>
                )}
              </div>

              {!googleUser ? (
                <div className="p-8 text-center border border-dashed border-[#e4ded5] dark:border-[#2d3139] rounded-xl space-y-3">
                  <CalendarIcon className="w-8 h-8 text-purple-400 mx-auto" />
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Connect your Google account to see external calendar events and push new schedules automatically.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {isLoadingCalendar ? (
                    <p className="text-xs text-stone-400 py-4 text-center">Loading Google Calendar events...</p>
                  ) : googleCalendarEvents.length === 0 ? (
                    <p className="text-xs text-stone-400 py-4 text-center">No upcoming events found on Google Calendar.</p>
                  ) : (
                    googleCalendarEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#1f2229] shadow-2xs flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-stone-900 dark:text-stone-100">{evt.summary}</p>
                          <p className="text-[11px] text-stone-500">
                            {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString() : evt.start?.date}
                          </p>
                        </div>
                        {evt.htmlLink && (
                          <a
                            href={evt.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                            title="Open in Google Calendar"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: GMAIL INSIGHTS
             ======================================================== */}
          {activeTab === 'gmail' && (
            <div className="space-y-5 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-500" />
                    <span>Gmail Insights</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Extract reservations and deadlines into shared calendar events.
                  </p>
                </div>

                {googleUser && (
                  <button
                    type="button"
                    onClick={handleLoadGmail}
                    disabled={isLoadingGmail}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#252830] hover:bg-stone-100 dark:hover:bg-[#2e323c] text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                    <span>Scan Gmail</span>
                  </button>
                )}
              </div>

              {!googleUser ? (
                <div className="p-8 text-center border border-dashed border-[#e4ded5] dark:border-[#2d3139] rounded-xl space-y-3">
                  <Mail className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Connect Google to extract appointments and reservation confirmations directly from Gmail.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {isLoadingGmail ? (
                    <p className="text-xs text-stone-400 py-4 text-center">Scanning recent emails...</p>
                  ) : gmailInsights.length === 0 ? (
                    <p className="text-xs text-stone-400 py-4 text-center">No action items found in recent emails.</p>
                  ) : (
                    gmailInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="p-3.5 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-white dark:bg-[#1f2229] shadow-2xs space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{insight.subject}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            insight.importance === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {insight.category}
                          </span>
                        </div>
                        <p className="text-stone-600 dark:text-stone-400">{insight.summary}</p>
                        {insight.suggestedEvent && (
                          <div className="pt-2 border-t border-stone-100 dark:border-[#2d3139] flex items-center justify-between">
                            <span className="text-[11px] text-stone-500">
                              Suggested: {insight.suggestedEvent.title} on {insight.suggestedEvent.startDate}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onAddEventFromAI && insight.suggestedEvent) {
                                  onAddEventFromAI({
                                    ...insight.suggestedEvent,
                                    assignedTo: 'both',
                                    tasks: [],
                                  });
                                  showAdminFeedback(`Scheduled "${insight.suggestedEvent.title}"!`);
                                }
                              }}
                              className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                            >
                              + Add to Schedule
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 7: PARTNER CHAT (FINAL OPTION)
             ======================================================== */}
          {activeTab === 'chat' && (
            <div className="space-y-4 max-w-4xl flex flex-col h-[520px]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Partner Chat</span>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Real-time messages across your paired devices.
                    </p>
                  </div>

                  {chatMessages.length > 0 && (
                    <div>
                      {confirmClearChat ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in">
                          <button
                            type="button"
                            onClick={() => {
                              setChatMessages([]);
                              try {
                                localStorage.removeItem(LOCAL_CHAT_KEY);
                              } catch (e) {}
                              setConfirmClearChat(false);
                              showAdminFeedback('Chat history cleared.');
                            }}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-2xs"
                          >
                            Confirm Clear?
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmClearChat(false)}
                            className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmClearChat(true)}
                          className="text-xs text-stone-500 hover:text-rose-600 border border-stone-200 dark:border-stone-700 px-2.5 py-1 rounded-lg bg-white dark:bg-[#202329] cursor-pointer transition-colors"
                        >
                          Clear Chat
                        </button>
                      )}
                    </div>
                  )}
                </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-stone-50 dark:bg-[#1a1d22]">
                {chatMessages.map((msg) => {
                  const isMe = msg.senderName.toLowerCase() === (currentUser?.name || '').toLowerCase();
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mb-0.5">
                        <span className="font-bold text-stone-700 dark:text-stone-300">{msg.senderName}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${
                          isMe
                            ? 'bg-purple-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-[#252830] text-stone-900 dark:text-stone-100 border border-[#e4ded5] dark:border-[#353943] rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message to partner..."
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1f2229] text-xs text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-3 border-t border-[#e5e0d8] dark:border-[#2d3139] bg-stone-50 dark:bg-[#1f2229] flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span>Active Hub:</span>
            {hubs && hubs.length > 1 ? (
              <select
                value={currentHub?.id || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    switchHub(e.target.value);
                  }
                }}
                className="bg-transparent font-bold text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded px-1.5 py-0.5 text-xs cursor-pointer"
              >
                {hubs.map((h) => (
                  <option key={h.id} value={h.id} className="bg-white dark:bg-[#1a1d22]">
                    {h.name} {h.id === currentHub?.id ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <strong className="text-stone-800 dark:text-stone-200">{currentHub?.name || 'Shared Life Hub'}</strong>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#e2ddd5] dark:border-[#353943] bg-white dark:bg-[#252830] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#2e323c] font-semibold cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* Template Create / Edit Sub-Modal */}
      {editingTemplate && (
        <div 
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setEditingTemplate(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#2d3139] rounded-2xl p-5 shadow-2xl text-stone-900 dark:text-stone-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e5e0d8] dark:border-[#2d3139] pb-3">
              <h3 className="font-bold text-base">
                {isCreatingTemplate ? 'Create New Routine Template' : `Edit "${editingTemplate.name}"`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="font-semibold block mb-1">Emoji</label>
                  <input
                    type="text"
                    value={editingTemplate.emoji}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, emoji: e.target.value })}
                    className="w-full p-2 text-center rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] text-lg"
                    maxLength={3}
                  />
                </div>
                <div className="col-span-3">
                  <label className="font-semibold block mb-1">Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="e.g. Farmers Market Trip"
                    required
                    className="w-full p-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Default Event Title</label>
                <input
                  type="text"
                  value={editingTemplate.defaultTitle}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultTitle: e.target.value })}
                  placeholder="e.g. Weekend Farmers Market"
                  required
                  className="w-full p-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as EventCategory })}
                    className="w-full p-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] outline-none font-medium"
                  >
                    {(['market', 'dinner_date', 'maintenance', 'pets', 'grocery_errand', 'other'] as EventCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Assigned Lead</label>
                  <select
                    value={editingTemplate.assignedTo}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, assignedTo: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] outline-none font-medium"
                  >
                    <option value="both">Both of Us</option>
                    <option value="her">{partner1Label}</option>
                    <option value="him">{partner2Label}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editingTemplate.defaultStartTime}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultStartTime: e.target.value })}
                    className="w-full p-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">End Time</label>
                  <input
                    type="time"
                    value={editingTemplate.defaultEndTime}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultEndTime: e.target.value })}
                    className="w-full p-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Tasks Editor */}
              <div className="pt-2 border-t border-[#e5e0d8] dark:border-[#2d3139]">
                <label className="font-semibold block mb-1">Default Checklist Tasks</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    placeholder="Add a checklist task..."
                    className="flex-1 p-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-stone-50 dark:bg-[#252830] outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTaskToEditing();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTaskToEditing}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {editingTemplate.defaultTasks.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-stone-50 dark:bg-[#252830] border border-stone-200 dark:border-[#2d3139]">
                      <span className="truncate">{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskFromEditing(idx)}
                        className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e0d8] dark:border-[#2d3139]">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
