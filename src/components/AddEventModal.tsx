import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  UtensilsCrossed, 
  Wrench, 
  Luggage, 
  ShoppingCart, 
  Calendar as CalendarIcon,
  RotateCcw,
  Copy,
  ChevronDown,
  ChevronUp,
  Camera,
  Plus,
  Sparkles
} from 'lucide-react';
import { CalendarEvent, EventCategory, EventTask, PlanTemplate } from '../types/calendar';
import { CATEGORY_CONFIG, formatReadableDate, formatUsTime, formatDateToYMD } from '../utils/calendarUtils';
import { INITIAL_TEMPLATES } from '../data/mockTemplates';
import { useAuth } from '../context/AuthContext';
import { GoogleTaskItem } from '../utils/googleWorkspace';

interface PinnedPhotoItem {
  id: string;
  url: string;
  caption: string;
  category: EventCategory;
}

interface AddEventModalProps {
  isOpen: boolean;
  initialDate: string;
  allEvents?: CalendarEvent[];
  templates?: PlanTemplate[];
  googleTasks?: GoogleTaskItem[];
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onOpenAdmin?: () => void;
}

const AVAILABLE_EMOJIS = ['🎪', '🍽️', '🔨', '🧳', '🛒', '📅', '☕', '🚗', '🧺', '🎨', '🍿', '💡'];

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  initialDate,
  allEvents = [],
  templates = INITIAL_TEMPLATES,
  onClose,
  onSave,
}) => {
  const { partner1Label, partner2Label } = useAuth();
  // Keep the add activity page completely blank unless a template is selected. No defaulting!
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('market');
  const [selectedEmoji, setSelectedEmoji] = useState('🎪');
  const [startDate, setStartDate] = useState(initialDate || formatDateToYMD(new Date()));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [assignedTo, setAssignedTo] = useState<'both' | 'him' | 'her'>('both');
  const [notes, setNotes] = useState('');
  const [boothFee, setBoothFee] = useState('');
  const [targetRevenue, setTargetRevenue] = useState('');
  const [taskInputs, setTaskInputs] = useState<string[]>([]);
  
  // Photos mimicking the fridge photo experience
  const [pinnedPhotos, setPinnedPhotos] = useState<PinnedPhotoItem[]>([]);
  const [showPhotoDrawer, setShowPhotoDrawer] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState<EventCategory>('market');

  const [showRolloverSection, setShowRolloverSection] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Guarantee page starts blank whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateId('');
      setTitle('');
      setCategory('market');
      setSelectedEmoji('🎪');
      setStartDate(initialDate || formatDateToYMD(new Date()));
      setStartTime('');
      setEndTime('');
      setTimeError(null);
      setLocationName('');
      setAddress('');
      setAssignedTo('both');
      setNotes('');
      setBoothFee('');
      setTargetRevenue('');
      setTaskInputs([]);
      setPinnedPhotos([]);
      setShowPhotoDrawer(false);
      setShowRolloverSection(false);
      setAiPrompt('');
      setAiError(null);
    }
  }, [isOpen, initialDate]);

  const handleAiAutoFill = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/parse-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          referenceDate: startDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI could not parse event');
      }
      if (data.title) setTitle(data.title);
      if (data.category) setCategory(data.category);
      if (data.emoji) setSelectedEmoji(data.emoji);
      if (data.startTime) setStartTime(data.startTime);
      if (data.endTime) setEndTime(data.endTime);
      if (data.locationName) setLocationName(data.locationName);
      if (data.notes) setNotes(data.notes);
      if (data.assignedTo) setAssignedTo(data.assignedTo);
      if (data.tasks && Array.isArray(data.tasks)) setTaskInputs(data.tasks);
      setAiPrompt('');
    } catch (e: any) {
      setAiError(e.message || 'AI autofill failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  // Apply a selected template
  const applyTemplate = (tmpl: PlanTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setTitle(tmpl.defaultTitle);
    setCategory(tmpl.category);
    setSelectedEmoji(tmpl.emoji || CATEGORY_CONFIG[tmpl.category]?.emoji || '📅');
    setStartTime(tmpl.defaultStartTime || '');
    setEndTime(tmpl.defaultEndTime || '');
    setLocationName(tmpl.defaultLocationName || '');
    setAssignedTo(tmpl.assignedTo);
    setTaskInputs([...tmpl.defaultTasks]);
    setNotes(tmpl.defaultNotes || '');
    if (tmpl.marketDetails) {
      setBoothFee(tmpl.marketDetails.boothFee ? String(tmpl.marketDetails.boothFee) : '');
      setTargetRevenue(tmpl.marketDetails.targetRevenue ? String(tmpl.marketDetails.targetRevenue) : '');
    } else {
      setBoothFee('');
      setTargetRevenue('');
    }
  };

  // Clear template and reset form to strictly blank
  const handleClearTemplate = () => {
    setSelectedTemplateId('');
    setTitle('');
    setCategory('market');
    setSelectedEmoji('🎪');
    setStartTime('');
    setEndTime('');
    setLocationName('');
    setAddress('');
    setAssignedTo('both');
    setNotes('');
    setBoothFee('');
    setTargetRevenue('');
    setTaskInputs([]);
  };

  const handleTemplateDropdownChange = (tmplId: string) => {
    if (!tmplId) {
      handleClearTemplate();
      return;
    }
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      applyTemplate(tmpl);
    }
  };

  const handleCategorySelect = (cat: EventCategory) => {
    setCategory(cat);
    setSelectedEmoji(CATEGORY_CONFIG[cat].emoji);
  };

  // Only tasks that are actually past due (assigned day is strictly before today)
  const TODAY_STR = formatDateToYMD(new Date());
  const pastDueIncompleteTasks: Array<{
    title: string;
    sourceEventTitle: string;
    sourceDate: string;
    assignedTo?: 'both' | 'him' | 'her';
  }> = [];

  allEvents.forEach((evt) => {
    if (evt.startDate < TODAY_STR && evt.tasks) {
      evt.tasks.forEach((t) => {
        if (!t.completed) {
          pastDueIncompleteTasks.push({
            title: t.title,
            sourceEventTitle: evt.title,
            sourceDate: evt.startDate,
            assignedTo: t.assignedTo,
          });
        }
      });
    }
  });

  const handleCopyPastTask = (taskTitle: string) => {
    setTaskInputs((prev) => {
      const filtered = prev.filter((p) => p.trim().length > 0);
      return [...filtered, taskTitle];
    });
    setShowRolloverSection(false);
  };

  const handleAddTaskField = () => {
    setTaskInputs([...taskInputs, '']);
  };

  const handleTaskInputChange = (idx: number, val: string) => {
    const updated = [...taskInputs];
    updated[idx] = val;
    setTaskInputs(updated);
  };

  const samplePhotoUrls: Record<EventCategory, string> = {
    market: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
    dinner_date: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
    maintenance: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&auto=format&fit=crop&q=80',
    pets: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
    packing: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
    grocery_errand: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
    other: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80',
  };

  const handleAddPhotoMementos = () => {
    const meta = CATEGORY_CONFIG[photoCategory];
    const newP: PinnedPhotoItem = {
      id: `p-${Date.now()}`,
      url: samplePhotoUrls[photoCategory],
      caption: photoCaption || `${meta.shortLabel} Snapshot`,
      category: photoCategory
    };
    setPinnedPhotos([...pinnedPhotos, newP]);
    setPhotoCaption('');
    setShowPhotoDrawer(false);
  };

  const handleRemovePinnedPhoto = (id: string) => {
    setPinnedPhotos(pinnedPhotos.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (startTime && endTime && endTime <= startTime) {
      setTimeError('End time must be after start time');
      return;
    }
    setTimeError(null);

    const initialTasks: EventTask[] = taskInputs
      .filter((t) => t.trim().length > 0)
      .map((t, idx) => ({
        id: `t-new-${Date.now()}-${idx}`,
        title: t.trim(),
        completed: false,
        assignedTo,
      }));

    const newEvt: Omit<CalendarEvent, 'id'> = {
      title: title.trim(),
      category,
      emoji: selectedEmoji,
      startDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      locationName: locationName.trim() || undefined,
      address: address.trim() || undefined,
      assignedTo,
      notes: notes.trim() || undefined,
      tasks: initialTasks,
      photoCount: pinnedPhotos.length,
      photos: pinnedPhotos.map((p) => p.url),
      marketDetails: category === 'market' ? {
        venueName: locationName || 'Market Location',
        boothFee: Number(boothFee) || 0,
        targetRevenue: Number(targetRevenue) || 0,
      } : undefined
    };

    onSave(newEvt);
    onClose();
  };

  const categoryKeys: EventCategory[] = ['market', 'dinner_date', 'maintenance', 'pets', 'grocery_errand', 'other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-2xl max-w-lg w-full border border-[#e4ded5] dark:border-[#2d3139] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e4ded5] dark:border-[#2d3139] bg-[#f5f1e8] dark:bg-[#202329] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 font-serif">
              Add Activity for {formatReadableDate(startDate)}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Schedule plans, pop-ups, chores, or pick a 1-tap template
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Dropdown: Hidden in dropdown sorted by admin page card order, with clear option */}
        <div className="p-2.5 px-4 bg-stone-100/90 dark:bg-[#22252c] border-b border-[#e4ded5] dark:border-[#2d3139] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <label
              htmlFor="template-select-dropdown"
              className="text-xs font-mono font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Template:</span>
            </label>
            <select
              id="template-select-dropdown"
              value={selectedTemplateId}
              onChange={(e) => handleTemplateDropdownChange(e.target.value)}
              className="flex-1 text-xs bg-white dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#353943] text-stone-800 dark:text-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 cursor-pointer shadow-2xs font-medium"
            >
              <option value="">No template (Blank activity)</option>
              {templates.map((tmpl) => {
                const meta = CATEGORY_CONFIG[tmpl.category] || CATEGORY_CONFIG.other;
                return (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.emoji} {tmpl.name} ({meta.shortLabel})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedTemplateId && (
            <button
              type="button"
              onClick={handleClearTemplate}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#202329] text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-700 transition-colors cursor-pointer flex items-center gap-1 font-semibold shadow-2xs"
              title="Remove template and start blank"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Template</span>
            </button>
          )}
        </div>

        {/* AI Quick Auto-Fill: Let Gemini parse natural language request into this form */}
        <div className="p-2.5 px-4 bg-purple-50/70 dark:bg-purple-950/20 border-b border-purple-200/80 dark:border-purple-900/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAiAutoFill();
                }
              }}
              placeholder="Ask AI to plan: e.g. 'Dinner date Friday 7pm at Osteria Mozza with flowers task'"
              className="flex-1 text-xs bg-white dark:bg-[#1a1d22] border border-purple-300/80 dark:border-purple-800/80 rounded-md px-2.5 py-1 text-stone-800 dark:text-stone-200 placeholder-stone-400 outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleAiAutoFill}
              disabled={isAiLoading || !aiPrompt.trim()}
              className="text-xs px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer shrink-0"
            >
              {isAiLoading ? 'Filling...' : 'AI Fill'}
            </button>
          </div>
          {aiError && (
            <p className="text-[10px] text-rose-500 mt-1">{aiError}</p>
          )}
        </div>

        {/* Copy from Past Due Incomplete Tasks Drawer */}
        {pastDueIncompleteTasks.length > 0 && (
          <div className="bg-amber-100/40 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/50 p-3">
            <button
              type="button"
              onClick={() => setShowRolloverSection(!showRolloverSection)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Copy past due unfinished tasks ({pastDueIncompleteTasks.length})</span>
              </div>
              {showRolloverSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showRolloverSection && (
              <div className="mt-2 space-y-2 pt-2 border-t border-amber-200 dark:border-amber-900/50">
                <p className="text-[11px] text-stone-600 dark:text-stone-300">
                  Tasks not completed by their original due date:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {pastDueIncompleteTasks.map((t, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-white dark:bg-[#252830] border border-[#e4ded5] dark:border-[#353943] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="truncate">
                        <span className="font-medium text-stone-800 dark:text-stone-200">{t.title}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 block">
                          Due: {formatReadableDate(t.sourceDate)} · {t.sourceEventTitle}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPastTask(t.title)}
                        className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-semibold px-2 py-0.8 rounded shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          
          {/* Category Chooser with Shortened Names and Matching Colors */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 uppercase font-mono">
              Activity Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categoryKeys.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-2 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 dark:border-stone-100 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-2xs'
                        : `${config.badgeBg} ${config.borderColor} ${config.textColor} hover:opacity-90`
                    }`}
                  >
                    <div className="font-semibold">{config.shortLabel}</div>
                    <div className="text-[10px] opacity-75 truncate">{config.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option to Edit & Pick Event Emoji */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Event Icon / Emoji
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {AVAILABLE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-transform cursor-pointer shrink-0 ${
                    selectedEmoji === emoji
                      ? 'bg-amber-100 dark:bg-amber-900/50 border-2 border-stone-900 dark:border-stone-100 scale-110 shadow-xs'
                      : 'bg-white dark:bg-[#252830] border border-[#e4ded5] dark:border-[#353943] hover:scale-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Title / Activity Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Autumn Artisan Pop-Up or Dinner at Nopa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Start Time {startTime && <span className="font-mono font-normal text-stone-500 text-[11px]">({formatUsTime(startTime)})</span>}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (timeError) setTimeError(null);
                }}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                End Time {endTime && <span className="font-mono font-normal text-stone-500 text-[11px]">({formatUsTime(endTime)})</span>}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  if (timeError) setTimeError(null);
                }}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 font-mono"
              />
            </div>
          </div>
          {timeError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {timeError}
            </div>
          )}

          {/* Lead Selector: Hers / His / Both */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Lead
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900"
            >
              <option value="both">Both of Us (Shared)</option>
              <option value="her">{partner1Label}</option>
              <option value="him">{partner2Label}</option>
            </select>
          </div>

          {/* Location & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Location Name / Venue
              </label>
              <input
                type="text"
                placeholder="e.g. Fort Mason Center"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Address or Notes
              </label>
              <input
                type="text"
                placeholder="e.g. 2 Marina Blvd"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>

          {/* Individual Checklist Tasks for this Event */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Individual Checklist Tasks
              </label>
              <button
                type="button"
                onClick={handleAddTaskField}
                className="text-[11px] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium cursor-pointer"
              >
                + Add another task
              </button>
            </div>
            {taskInputs.map((taskText, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Task ${idx + 1} (e.g. Pack canopy, charge reader, buy milk)`}
                value={taskText}
                onChange={(e) => handleTaskInputChange(idx, e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            ))}
          </div>

          {/* Photo Section Mimicking the Fridge Experience as requested */}
          <div className="p-3.5 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-[#f7f4ec]/60 dark:bg-[#202329] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-stone-500" />
                  <span>Pin Event Photos & Mementos ({pinnedPhotos.length})</span>
                </label>
                <span className="text-[10px] text-stone-400">Booth setup layouts, receipts, and date photos</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoDrawer(!showPhotoDrawer)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white dark:bg-[#292d36] border border-[#e4ded5] dark:border-[#353943] text-stone-800 dark:text-stone-200 px-2 py-1 rounded-md shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Photo</span>
              </button>
            </div>

            {/* Photo Entry Drawer */}
            {showPhotoDrawer && (
              <div className="p-3 bg-white dark:bg-[#1a1d22] rounded-lg border border-[#e4ded5] dark:border-[#353943] space-y-2 text-xs">
                <span className="font-medium text-stone-800 dark:text-stone-200 block">Choose category & caption:</span>
                
                <div className="flex flex-wrap gap-1">
                  {categoryKeys.map((cKey) => {
                    const cMeta = CATEGORY_CONFIG[cKey];
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => setPhotoCategory(cKey)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                          photoCategory === cKey
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900'
                            : 'bg-stone-100 dark:bg-[#252830] text-stone-700 dark:text-stone-300 border-[#e4ded5] dark:border-[#353943]'
                        }`}
                      >
                        {cMeta.emoji} {cMeta.shortLabel}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Photo caption (e.g. Booth tier setup, parts receipt)..."
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329]"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPhotoDrawer(false)}
                    className="text-[11px] text-stone-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPhotoMementos}
                    className="px-2.5 py-1 rounded bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium text-[11px] cursor-pointer"
                  >
                    Attach Snapshot
                  </button>
                </div>
              </div>
            )}

            {/* Display Pinned Photos like polaroids on the form */}
            {pinnedPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {pinnedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="p-1.5 bg-white dark:bg-[#252830] rounded border border-[#e4ded5] dark:border-[#353943] relative shadow-2xs group"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemovePinnedPhoto(photo.id)}
                      className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                      title="Remove"
                    >
                      ×
                    </button>
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-16 object-cover rounded mb-1"
                    />
                    <p className="text-[10px] text-stone-700 dark:text-stone-300 truncate font-medium">
                      {photo.caption}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Market Specific Fields */}
          {category === 'market' && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 space-y-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase font-mono block">
                Pop-Up Market Financial Target
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-amber-800 dark:text-amber-300 mb-1">
                    Booth Fee ($)
                  </label>
                  <input
                    type="number"
                    value={boothFee}
                    onChange={(e) => setBoothFee(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-amber-300 dark:border-amber-800/60 bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-amber-800 dark:text-amber-300 mb-1">
                    Target Revenue ($)
                  </label>
                  <input
                    type="number"
                    value={targetRevenue}
                    onChange={(e) => setTargetRevenue(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-amber-300 dark:border-amber-800/60 bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200"
                  />
                </div>
              </div>
              <div className="pt-1 border-t border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 font-medium flex items-center justify-between">
                <span>📦 Barcode Packout & POS Register buttons will be ready on this market card.</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">Heart &gt; Inventory for barcodes</span>
              </div>
            </div>
          )}

          {/* Notes: Clean label without bullet points mention */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Any details or reminders for this plan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 whitespace-pre-wrap font-sans"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#e4ded5] dark:border-[#2d3139] flex items-center justify-between gap-2">
            <div>
              {timeError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {timeError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Add Activity
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
