import React, { useState, useEffect } from 'react';
import { 
  X, 
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

const categoryKeys: EventCategory[] = ['market', 'dinner_date', 'maintenance', 'pets', 'grocery_errand', 'other'];

const samplePhotoUrls: Record<EventCategory, string> = {
  market: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
  dinner_date: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
  maintenance: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&auto=format&fit=crop&q=80',
  pets: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
  packing: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
  grocery_errand: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
  other: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80',
};

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  initialDate,
  allEvents = [],
  templates = INITIAL_TEMPLATES,
  onClose,
  onSave,
}) => {
  const { partner1Label, partner2Label } = useAuth();
  
  // 3-step wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form field states
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
  
  // Photos
  const [pinnedPhotos, setPinnedPhotos] = useState<PinnedPhotoItem[]>([]);
  const [showPhotoDrawer, setShowPhotoDrawer] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState<EventCategory>('market');

  const [showRolloverSection, setShowRolloverSection] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Reset modal state to blank on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
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
      if (data.category && CATEGORY_CONFIG[data.category as EventCategory]) {
        setCategory(data.category as EventCategory);
        setSelectedEmoji(CATEGORY_CONFIG[data.category as EventCategory].emoji);
      }
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
    setSelectedEmoji(CATEGORY_CONFIG[cat]?.emoji || '📅');
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    if (startTime && endTime && endTime <= startTime) {
      setTimeError('End time must be after start time');
      setStep(2);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-2xl max-w-lg w-full border border-[#e4ded5] dark:border-[#2d3139] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#e4ded5] dark:border-[#2d3139] bg-[#f5f1e8] dark:bg-[#202329] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 font-serif">
              Add Activity for {formatReadableDate(startDate)}
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Step {step} of 3 · {step === 1 ? 'Basics & Category' : step === 2 ? 'Date, Time & Lead' : 'Details & Tasks'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Guided Progress Bar */}
        <div className="grid grid-cols-3 border-b border-[#e4ded5] dark:border-[#2d3139] bg-[#f5f1e8]/60 dark:bg-[#202329]/60 p-1.5 gap-1.5 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              step === 1
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
            }`}
          >
            <span className="w-4 h-4 rounded-full border border-current text-[10px] flex items-center justify-center shrink-0">1</span>
            <span className="truncate">Basics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (step === 2 && startTime && endTime && endTime <= startTime) {
                setTimeError('End time must be after start time');
                return;
              }
              setStep(2);
            }}
            className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              step === 2
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
            }`}
          >
            <span className="w-4 h-4 rounded-full border border-current text-[10px] flex items-center justify-center shrink-0">2</span>
            <span className="truncate">When & Who</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (startTime && endTime && endTime <= startTime) {
                setTimeError('End time must be after start time');
                setStep(2);
                return;
              }
              setStep(3);
            }}
            className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              step === 3
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
            }`}
          >
            <span className="w-4 h-4 rounded-full border border-current text-[10px] flex items-center justify-center shrink-0">3</span>
            <span className="truncate">Details & Tasks</span>
          </button>
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ================= STEP 1: BASICS ================= */}
          {step === 1 && (
            <div className="p-4 space-y-4">
              
              {/* Quick Start: Templates Dropdown */}
              <div className="p-2.5 px-3 bg-stone-100/90 dark:bg-[#22252c] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] flex items-center justify-between gap-2.5 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
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
                    className="flex-1 text-xs bg-white dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#353943] text-stone-800 dark:text-stone-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 cursor-pointer shadow-2xs font-medium"
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
                    className="text-xs px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#202329] text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-700 transition-colors cursor-pointer flex items-center gap-1 font-semibold shadow-2xs"
                    title="Remove template and start blank"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* AI Quick Auto-Fill */}
              <div className="p-2.5 px-3 bg-purple-50/70 dark:bg-purple-950/20 rounded-xl border border-purple-200/80 dark:border-purple-900/50">
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
                    placeholder="Ask AI: e.g. 'Dinner date Friday 7pm at Osteria Mozza with flowers task'"
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

              {/* Rollover Drawer if Past Due Tasks */}
              {pastDueIncompleteTasks.length > 0 && (
                <div className="bg-amber-100/40 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 p-2.5">
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
                    <div className="mt-2 space-y-1.5 pt-2 border-t border-amber-200 dark:border-amber-900/50">
                      <p className="text-[11px] text-stone-600 dark:text-stone-300">
                        Tasks not completed by their original due date:
                      </p>
                      <div className="max-h-28 overflow-y-auto space-y-1">
                        {pastDueIncompleteTasks.map((t, i) => (
                          <div
                            key={i}
                            className="p-1.5 px-2 rounded bg-white dark:bg-[#252830] border border-[#e4ded5] dark:border-[#353943] flex items-center justify-between gap-2 text-xs"
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
                              className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 flex items-center gap-1 cursor-pointer"
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

              {/* Activity Type: Compact 3x2 Grid */}
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
                        className={`p-2 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'border-stone-900 dark:border-stone-100 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-2xs font-semibold'
                            : `${config.badgeBg} ${config.borderColor} ${config.textColor} hover:opacity-90`
                        }`}
                      >
                        <span className="text-sm shrink-0">{config.emoji}</span>
                        <div className="truncate">
                          <div className="truncate">{config.shortLabel}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title / Activity Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Title / Activity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autumn Artisan Pop-Up or Dinner at Nopa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setStep(2);
                    }
                  }}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

            </div>
          )}

          {/* ================= STEP 2: WHEN & WHO ================= */}
          {step === 2 && (
            <div className="p-4 space-y-4">
              
              {/* Date & Time Grid */}
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

              {/* Lead / Assigned To: 3-Button Segmented Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 uppercase font-mono">
                  Assigned To / Lead
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'both', label: 'K&D (Shared)' },
                    { id: 'her', label: partner1Label },
                    { id: 'him', label: partner2Label },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAssignedTo(opt.id as any)}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                        assignedTo === opt.id
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-2xs'
                          : 'bg-white dark:bg-[#1a1d22] text-stone-700 dark:text-stone-300 border-[#e4ded5] dark:border-[#353943] hover:bg-stone-50 dark:hover:bg-[#252830]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= STEP 3: DETAILS & TASKS ================= */}
          {step === 3 && (
            <div className="p-4 space-y-4">
              
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
                        placeholder="e.g. 150"
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
                        placeholder="e.g. 800"
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-amber-300 dark:border-amber-800/60 bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>
                  <div className="pt-1 border-t border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                    <span>📦 Barcode Packout & POS Register buttons will be ready on this market card.</span>
                  </div>
                </div>
              )}

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
                    Address or Venue Notes
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

              {/* Individual Checklist Tasks */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Individual Checklist Tasks ({taskInputs.filter(t => t.trim()).length})
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

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any details or reminders for this plan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 whitespace-pre-wrap font-sans"
                />
              </div>

              {/* Photo Section */}
              <div className="p-3 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-[#f7f4ec]/60 dark:bg-[#202329] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-stone-500" />
                      <span>Pin Event Photos ({pinnedPhotos.length})</span>
                    </label>
                    <span className="text-[10px] text-stone-400">Booth setups, receipts, date snapshots</span>
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

                {showPhotoDrawer && (
                  <div className="p-2.5 bg-white dark:bg-[#1a1d22] rounded-lg border border-[#e4ded5] dark:border-[#353943] space-y-2 text-xs">
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
                      placeholder="Photo caption (e.g. Booth setup, receipt)..."
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
                          className="w-full h-14 object-cover rounded mb-1"
                        />
                        <p className="text-[10px] text-stone-700 dark:text-stone-300 truncate font-medium">
                          {photo.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Sticky Modal Bottom Footer */}
        <div className="p-3 sm:p-4 border-t border-[#e4ded5] dark:border-[#2d3139] bg-[#f5f1e8] dark:bg-[#202329] flex items-center justify-between gap-2 shrink-0">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] cursor-pointer transition-colors shadow-2xs"
              >
                ← Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 && title.trim().length > 0 && (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-[#313640] rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#252830] transition-colors cursor-pointer shadow-2xs"
                title="Quick save activity with current details"
              >
                Save Now
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 2 && startTime && endTime && endTime <= startTime) {
                    setTimeError('End time must be after start time');
                    return;
                  }
                  setTimeError(null);
                  setStep((s) => (s + 1) as any);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!title.trim()}
                className="px-4 py-1.5 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 disabled:opacity-40 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Save Activity
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
