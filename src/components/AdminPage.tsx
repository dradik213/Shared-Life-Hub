import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Copy, 
  CheckCircle2, 
  X, 
  Clock, 
  MapPin, 
  Store, 
  UtensilsCrossed, 
  Wrench, 
  Luggage, 
  ShoppingCart, 
  Calendar as CalendarIcon,
  Sliders,
  Settings,
  ShieldCheck,
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  Check,
  Heart
} from 'lucide-react';
import { EventCategory, PlanTemplate } from '../types/calendar';
import { CATEGORY_CONFIG, formatTimeRange, formatUsTime } from '../utils/calendarUtils';
import { INITIAL_TEMPLATES } from '../data/mockTemplates';
import { useAuth } from '../context/AuthContext';

interface AdminPageProps {
  templates: PlanTemplate[];
  onUpdateTemplate: (template: PlanTemplate) => void;
  onCreateTemplate: (template: PlanTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onReorderTemplates?: (templates: PlanTemplate[]) => void;
  onResetTemplates: () => void;
  onBackToCalendar: () => void;
  onClearAllEventsAndStays?: () => void;
  onOpenInviteModal?: () => void;
  onOpenProfileModal?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  templates,
  onUpdateTemplate,
  onCreateTemplate,
  onDeleteTemplate,
  onReorderTemplates,
  onResetTemplates,
  onBackToCalendar,
  onClearAllEventsAndStays,
  onOpenInviteModal,
  onOpenProfileModal,
}) => {
  const { 
    currentUser, 
    currentHub, 
    partnerUser, 
    coupleViewLabel, 
    partner1Label, 
    partner2Label, 
    partner1DisplayName, 
    partner2DisplayName, 
    updateHubName 
  } = useAuth();
  const isPartnerPending = !partnerUser || (!currentHub?.members || currentHub.members.length < 2);
  const [editingTemplate, setEditingTemplate] = useState<PlanTemplate | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTaskInput, setNewTaskInput] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);
  const [confirmResetTemplates, setConfirmResetTemplates] = useState(false);
  const [isEditingHubName, setIsEditingHubName] = useState(false);
  const [hubNameDraft, setHubNameDraft] = useState('');

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

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
    showFeedback(`Reordered "${item.name}".`);
  };

  const handleStartCreate = () => {
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
      defaultNotes: ''
    };
    setEditingTemplate(newTmpl);
    setIsCreating(true);
  };

  const handleStartEdit = (tmpl: PlanTemplate) => {
    setEditingTemplate({
      ...tmpl,
      defaultTasks: [...tmpl.defaultTasks]
    });
    setIsCreating(false);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    if (isCreating) {
      onCreateTemplate(editingTemplate);
      showFeedback(`Created "${editingTemplate.name}" template successfully.`);
    } else {
      onUpdateTemplate(editingTemplate);
      showFeedback(`Updated "${editingTemplate.name}" template.`);
    }
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleAddTaskToEditing = () => {
    if (!newTaskInput.trim() || !editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      defaultTasks: [...editingTemplate.defaultTasks, newTaskInput.trim()]
    });
    setNewTaskInput('');
  };

  const handleRemoveTaskFromEditing = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      defaultTasks: editingTemplate.defaultTasks.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e4ded5] dark:border-[#2d3139]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCalendar}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#2b2f37] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Calendar</span>
          </button>
          
          <div>
            <h1 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-stone-700 dark:text-stone-300" />
              <span>Hub Admin & Template Controls</span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Customize 1-tap activity templates, default checklists, and couple presets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3.5 py-1.5 rounded-lg shadow-xs hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Template</span>
          </button>
          {confirmResetTemplates ? (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  onResetTemplates();
                  setConfirmResetTemplates(false);
                  showFeedback('Templates reset to default presets.');
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-2xs"
              >
                Confirm Reset?
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetTemplates(false)}
                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer px-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmResetTemplates(true)}
              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Primary Section: Activity Templates (Main Function) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Activity Templates ({templates.length})</span>
            </h2>
            <p className="text-xs text-stone-500">
              These templates power the 1-tap options when scheduling activities in Add Activity.
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl, idx) => {
            const cfg = CATEGORY_CONFIG[tmpl.category] || CATEGORY_CONFIG.other;
            const partnerBadge = tmpl.assignedTo === 'her' ? partner1Label : tmpl.assignedTo === 'him' ? partner2Label : 'Both';

            return (
              <div
                key={tmpl.id}
                className={`rounded-xl border p-4 transition-all shadow-xs flex flex-col justify-between ${cfg.badgeBg} ${cfg.borderColor}`}
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Emoji, Name, Category Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl leading-none">{tmpl.emoji}</span>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {tmpl.name}
                        </h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.badgeBg} ${cfg.borderColor} ${cfg.textColor}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Card Order buttons for sorting on admin page */}
                      <div className="flex items-center border border-stone-200/80 dark:border-stone-700/80 rounded bg-white/70 dark:bg-black/30 overflow-hidden text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleMoveTemplate(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 hover:bg-stone-200/60 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 disabled:opacity-25 transition-colors cursor-pointer"
                          title="Move left/earlier in order"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="px-1 font-mono font-bold text-stone-500">#{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleMoveTemplate(idx, 1)}
                          disabled={idx === templates.length - 1}
                          className="p-1 hover:bg-stone-200/60 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 disabled:opacity-25 border-l border-stone-200/80 dark:border-stone-700/80 transition-colors cursor-pointer"
                          title="Move right/later in order"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/70 dark:bg-black/30 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {partnerBadge}
                      </span>
                    </div>
                  </div>

                  {/* Title & Times */}
                  <div className="space-y-1 text-xs">
                    <p className={`font-semibold ${cfg.textColor}`}>
                      {tmpl.defaultTitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] opacity-80 font-mono">
                      {tmpl.defaultStartTime && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeRange(tmpl.defaultStartTime, tmpl.defaultEndTime)}</span>
                        </span>
                      )}
                      {tmpl.defaultLocationName && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{tmpl.defaultLocationName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Market info if applicable */}
                  {tmpl.category === 'market' && tmpl.marketDetails && (
                    <div className="p-2 rounded bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] font-mono flex items-center justify-between">
                      <span>Fee: ${tmpl.marketDetails.boothFee || 0}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">Goal: ${tmpl.marketDetails.targetRevenue || 0}</span>
                    </div>
                  )}

                  {/* Checklist Tasks preview */}
                  <div className="pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block mb-1">
                      Checklist Items ({tmpl.defaultTasks.length}):
                    </span>
                    <ul className="space-y-1 text-[11px] max-h-24 overflow-y-auto pr-1">
                      {tmpl.defaultTasks.slice(0, 4).map((task, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                          <span className="truncate">{task}</span>
                        </li>
                      ))}
                      {tmpl.defaultTasks.length > 4 && (
                        <li className="text-[10px] text-stone-400 italic">
                          +{tmpl.defaultTasks.length - 4} more items...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 mt-3 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(tmpl)}
                    className="inline-flex items-center gap-1 text-stone-800 dark:text-stone-200 font-semibold hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Template</span>
                  </button>

                  {confirmDeleteTemplateId === tmpl.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteTemplate(tmpl.id);
                          setConfirmDeleteTemplateId(null);
                          showFeedback(`Deleted "${tmpl.name}".`);
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
                      className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
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
      </section>

      {/* Secondary Admin Section: Couple Hub Configuration & Reset for Publishing */}
      <section className="bg-[#fcfaf7] dark:bg-[#1a1d22] rounded-xl border border-[#e4ded5] dark:border-[#2d3139] p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e4ded5] dark:border-[#2d3139] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Shared Couple Hub & Accounts
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">
              {coupleViewLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInviteModal && (
              <button
                type="button"
                onClick={onOpenInviteModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Partner{isPartnerPending ? ' (1)' : ''}</span>
              </button>
            )}
            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#202329] border border-[#e4ded5] dark:border-[#353943] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-500 font-mono block">Hub Name & Invite Code</span>
              {!isEditingHubName && (
                <button
                  type="button"
                  onClick={() => {
                    setHubNameDraft(currentHub?.name || '');
                    setIsEditingHubName(true);
                  }}
                  className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>Edit Name</span>
                </button>
              )}
            </div>

            {isEditingHubName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (hubNameDraft.trim()) {
                    updateHubName(hubNameDraft.trim());
                    showFeedback(`Hub name updated to "${hubNameDraft.trim()}"`);
                  }
                  setIsEditingHubName(false);
                }}
                className="pt-1 space-y-1.5"
              >
                <input
                  type="text"
                  value={hubNameDraft}
                  onChange={(e) => setHubNameDraft(e.target.value)}
                  placeholder="e.g. Dustin & Sarah's Life"
                  autoFocus
                  className="w-full text-xs font-bold px-2 py-1 rounded border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#1a1d22] text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[10px] cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingHubName(false)}
                    className="px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                {currentHub?.name || 'Couple Shared Hub'}
              </span>
            )}

            {currentHub && (
              <div className="flex items-center gap-2 mt-1.5 pt-0.5">
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                  {currentHub.inviteCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentHub.inviteCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="text-[11px] text-stone-500 hover:text-purple-600 cursor-pointer"
                >
                  {copiedCode ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#202329] border border-[#e4ded5] dark:border-[#353943] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-500 font-mono block">
                {isPartnerPending ? 'Partner Invite (1)' : 'Partner & Perspective'}
              </span>
              {isPartnerPending && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                  1 pending
                </span>
              )}
            </div>
            <span className="font-bold text-stone-900 dark:text-stone-100 block">
              {partner1DisplayName} & {partner2DisplayName}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-1">
              {currentUser ? `${currentUser.name} (${currentUser.gender})` : 'You'}
              {partnerUser ? ` • ${partnerUser.name} (${partnerUser.gender})` : ' • Partner pending (1 invite required)'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#202329] border border-[#e4ded5] dark:border-[#353943] space-y-1">
            <span className="text-[10px] text-stone-500 font-mono block">Publishing & Test Data</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 block">
              Pristine Launch State
            </span>
            {onClearAllEventsAndStays && (
              <div className="pt-1">
                {confirmClearData ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllEventsAndStays();
                        setConfirmClearData(false);
                        showFeedback('Cleared all events & stays! Ready to publish.');
                      }}
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Confirm Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearData(false)}
                      className="text-[11px] text-stone-500 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearData(true)}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                  >
                    Clear All Events & Stays
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EDIT / CREATE TEMPLATE MODAL */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#fcfaf7] dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#2d3139] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#e4ded5] dark:border-[#2d3139]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingTemplate.emoji}</span>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {isCreating ? 'Create Activity Template' : `Edit Template: ${editingTemplate.name}`}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Changes will appear in the Add Activity 1-tap template selector
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Template Name & Emoji */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Emoji
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTemplate.emoji}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, emoji: e.target.value })}
                    className="w-full text-center px-2 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-base"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Template Button Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pop-Up Market, Date Night"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['market', 'dinner_date', 'maintenance', 'pets', 'grocery_errand', 'other'] as EventCategory[]).map((cat) => {
                    const c = CATEGORY_CONFIG[cat];
                    const isSelected = editingTemplate.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditingTemplate({ ...editingTemplate, category: cat })}
                        className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? `${c.badgeBg} ${c.borderColor} font-bold ring-1 ring-stone-900 dark:ring-stone-100`
                            : 'bg-white dark:bg-[#202329] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <span>{c.emoji}</span>
                        <span className="truncate text-[11px]">{c.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Event Title */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Default Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artisan Pop-Up Market Booth"
                  value={editingTemplate.defaultTitle}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Default Lead Person */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Default Lead / Partner
                </label>
                <div className="flex items-center gap-2">
                  {(['both', 'her', 'him'] as Array<'both' | 'her' | 'him'>).map((lead) => (
                    <button
                      key={lead}
                      type="button"
                      onClick={() => setEditingTemplate({ ...editingTemplate, assignedTo: lead })}
                      className={`flex-1 py-1.5 rounded-lg border text-center transition-colors cursor-pointer ${
                        editingTemplate.assignedTo === lead
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold border-transparent'
                          : 'bg-white dark:bg-[#202329] border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {lead === 'both' ? 'Both of Us' : lead === 'her' ? partner1Label : partner2Label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Times & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Default Start Time {editingTemplate.defaultStartTime && <span className="font-mono font-normal text-stone-500 text-[11px]">({formatUsTime(editingTemplate.defaultStartTime)})</span>}
                  </label>
                  <input
                    type="time"
                    value={editingTemplate.defaultStartTime || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultStartTime: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Default End Time {editingTemplate.defaultEndTime && <span className="font-mono font-normal text-stone-500 text-[11px]">({formatUsTime(editingTemplate.defaultEndTime)})</span>}
                  </label>
                  <input
                    type="time"
                    value={editingTemplate.defaultEndTime || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultEndTime: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Default Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Waterfront Crafts Plaza"
                  value={editingTemplate.defaultLocationName || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultLocationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Checklist Tasks Editor */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-stone-700 dark:text-stone-300">
                  Default Checklist Tasks ({editingTemplate.defaultTasks.length})
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {editingTemplate.defaultTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-1.5 px-2 rounded bg-white dark:bg-[#202329] border border-[#e4ded5] dark:border-[#353943]"
                    >
                      <span className="truncate flex-1">{task}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskFromEditing(idx)}
                        className="text-stone-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Add new checklist task..."
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTaskToEditing();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddTaskToEditing}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-semibold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Default Notes */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Default Notes & Checkpoints
                </label>
                <textarea
                  rows={2}
                  value={editingTemplate.defaultNotes || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultNotes: e.target.value })}
                  placeholder="Setup reminders, reservation advice..."
                  className="w-full p-2.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e4ded5] dark:border-[#2d3139]">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#252830] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
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
