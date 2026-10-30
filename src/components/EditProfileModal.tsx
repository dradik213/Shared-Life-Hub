import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserGender } from '../types/auth';
import { X, User, CheckCircle2, Check, Sun, Moon, Sparkles, ChevronRight } from 'lucide-react';
import { PROFILE_COLORS } from './LoginScreen';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenWorkspaceModal?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  isOpen, 
  onClose,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenWorkspaceModal,
}) => {
  const { currentUser, currentHub, updateProfile, updateHubName } = useAuth();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [gender, setGender] = useState<UserGender>(currentUser?.gender || 'female');
  const [customPronoun, setCustomPronoun] = useState(currentUser?.customPronoun || '');
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || 'bg-purple-600');
  const [hubName, setHubName] = useState(currentHub?.name || '');

  if (!isOpen || !currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || currentUser.name,
      gender,
      customPronoun: gender === 'other' ? customPronoun.trim() : undefined,
      avatarColor,
    });
    if (hubName.trim()) {
      updateHubName(hubName.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#2d3139] rounded-2xl shadow-2xl p-5 sm:p-6 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#e4ded5] dark:border-[#2d3139]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Edit Profile & Gender
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Customize your pronouns and hub settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#252830] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-xs text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Gender & Pronouns (Powers couple view labels)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 dark:border-purple-400 ring-1 ring-purple-500'
                    : 'border-[#e4ded5] dark:border-[#353943] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">👩 Female</span>
                  {gender === 'female' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">She / Her / Hers</p>
              </button>

              <button
                type="button"
                onClick={() => setGender('male')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-400 ring-1 ring-blue-500'
                    : 'border-[#e4ded5] dark:border-[#353943] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">👨 Male</span>
                  {gender === 'male' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">He / Him / His</p>
              </button>

              <button
                type="button"
                onClick={() => setGender('non_binary')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  gender === 'non_binary'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-400 ring-1 ring-emerald-500'
                    : 'border-[#e4ded5] dark:border-[#353943] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">🌈 Non-Binary</span>
                  {gender === 'non_binary' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">They / Them / Theirs</p>
              </button>

              <button
                type="button"
                onClick={() => setGender('other')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  gender === 'other'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 dark:border-amber-400 ring-1 ring-amber-500'
                    : 'border-[#e4ded5] dark:border-[#353943] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">✨ Custom</span>
                  {gender === 'other' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Custom Pronouns</p>
              </button>
            </div>

            {gender === 'other' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Enter short pronoun (e.g. Ze)"
                  value={customPronoun}
                  onChange={(e) => setCustomPronoun(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-xs text-stone-900 dark:text-stone-100"
                />
              </div>
            )}
          </div>

          {/* Profile Avatar Color Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Avatar Color
              </label>
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full ${avatarColor} text-white text-[10px] font-bold flex items-center justify-center shadow-2xs`}>
                  {name ? name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-[11px] text-stone-500 font-medium">Preview</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap p-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329]">
              {PROFILE_COLORS.map((col) => (
                <button
                  key={col.class}
                  type="button"
                  onClick={() => setAvatarColor(col.class)}
                  className={`w-7 h-7 rounded-full ${col.class} flex items-center justify-center transition-all cursor-pointer ${
                    avatarColor === col.class
                      ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-white scale-110 shadow-sm'
                      : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  title={col.name}
                >
                  {avatarColor === col.class && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Hub Name
            </label>
            <input
              type="text"
              value={hubName}
              onChange={(e) => setHubName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-xs text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Preferred View (Day & Night Switcher living in profile settings) */}
          <div className="pt-2 border-t border-[#e4ded5] dark:border-[#2d3139]">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Preferred View (Theme Mode)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isDarkMode && onToggleDarkMode) onToggleDarkMode();
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  !isDarkMode
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-1 ring-amber-500 text-stone-900 dark:text-stone-100'
                    : 'border-[#e4ded5] dark:border-[#353943] text-stone-600 dark:text-stone-400 hover:border-stone-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold text-xs">Day View</div>
                    <div className="text-[10px] text-stone-500">Light Paper</div>
                  </div>
                </div>
                {!isDarkMode && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isDarkMode && onToggleDarkMode) onToggleDarkMode();
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isDarkMode
                    ? 'border-purple-500 bg-purple-950/40 border-purple-400 ring-1 ring-purple-500 text-stone-100'
                    : 'border-[#e4ded5] dark:border-[#353943] text-stone-600 dark:text-stone-400 hover:border-stone-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-xs">Night View</div>
                    <div className="text-[10px] text-stone-400">Deep Slate</div>
                  </div>
                </div>
                {isDarkMode && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
              </button>
            </div>
          </div>

          {/* AI & Google Workspace Sync (Integrated into Profile) */}
          {onOpenWorkspaceModal && (
            <div className="pt-2 border-t border-[#e4ded5] dark:border-[#2d3139]">
              <div className="flex items-center justify-between p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/60 dark:bg-purple-950/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-purple-950 dark:text-purple-200">AI & Google Workspace Sync</h4>
                    <p className="text-[10px] text-purple-700 dark:text-purple-400">Calendar, Tasks, Gmail & Partner Chat</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWorkspaceModal();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <span>Open Hub</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-[#252830] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
