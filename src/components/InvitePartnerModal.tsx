import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserGender } from '../types/auth';
import { X, Copy, Check, UserPlus, Heart, Users, RefreshCw, Mail, Share2 } from 'lucide-react';

interface InvitePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvitePartnerModal: React.FC<InvitePartnerModalProps> = ({ isOpen, onClose }) => {
  const { currentHub, currentUser, partnerUser, addPartnerToHub, switchUser, coupleViewLabel, joinHubWithCode } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick partner addition form
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerGender, setPartnerGender] = useState<UserGender>('female');

  // Join partner's existing hub
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen || !currentUser) return null;

  const hasValidHub = Boolean(currentHub?.id && currentHub?.inviteCode);

  const handleCopyCode = () => {
    if (!hasValidHub || !currentHub?.inviteCode) return;
    navigator.clipboard.writeText(currentHub.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!hasValidHub || !currentHub?.inviteCode) return;
    const link = `${window.location.origin}?hub=${currentHub.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDirectAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;
    addPartnerToHub({
      name: partnerName.trim(),
      email: partnerEmail.trim() || `${partnerName.toLowerCase().replace(/\s+/g, '')}@duosync.app`,
      gender: partnerGender,
    });
    setPartnerName('');
    setPartnerEmail('');
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await joinHubWithCode(joinCodeInput.trim());
      if (res.success) {
        setJoinCodeInput('');
        onClose();
      } else {
        setJoinError(res.error || 'Failed to join hub');
      }
    } catch (err: any) {
      setJoinError(err?.message || 'Error joining hub');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#2d3139] rounded-2xl shadow-2xl p-5 sm:p-6 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e4ded5] dark:border-[#2d3139]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Invite Partner to Shared Hub
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {currentHub?.name || 'Shared Hub'} • Active Couple View: <span className="font-semibold text-purple-600 dark:text-purple-400">{coupleViewLabel}</span>
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

        {/* Hub Invite Code Box */}
        <div className="my-5 p-4 rounded-xl bg-stone-50 dark:bg-[#202329] border border-[#e4ded5] dark:border-[#353943] text-center space-y-3">
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Share this invite code with your partner to link calendars & stays:
          </p>
          {!hasValidHub ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs font-semibold text-amber-800 dark:text-amber-300">
              Create or select a hub first
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div className="px-5 py-2.5 bg-white dark:bg-[#16181c] border-2 border-purple-500/60 rounded-xl font-mono text-xl sm:text-2xl font-black tracking-widest text-purple-700 dark:text-purple-300 shadow-inner">
                {currentHub?.inviteCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                disabled={!hasValidHub}
                className="p-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                title="Copy code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!hasValidHub}
              className="text-xs text-stone-600 dark:text-stone-300 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>
                {!hasValidHub
                  ? 'Create or select a hub first'
                  : copiedLink
                  ? 'Invite Link Copied to Clipboard!'
                  : 'Copy Invite Link with Code'}
              </span>
            </button>
          </div>
        </div>

        {/* Current Hub Members & Partner Status */}
        <div className="space-y-3 mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Hub Members & Perspectives
          </h3>

          {/* Current User */}
          <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser.name[0]}
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-medium">You</span>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  Gender: <span className="capitalize font-semibold">{currentUser.gender}</span> • Pronouns: {currentUser.gender === 'female' ? 'She / Her' : currentUser.gender === 'male' ? 'He / Him' : 'They / Them'}
                </div>
              </div>
            </div>
          </div>

          {/* Partner User */}
          {partnerUser ? (
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  {partnerUser.name[0]}
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span>{partnerUser.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-medium">Partner</span>
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Gender: <span className="capitalize font-semibold">{partnerUser.gender}</span> • Pronouns: {partnerUser.gender === 'female' ? 'She / Her' : partnerUser.gender === 'male' ? 'He / Him' : 'They / Them'}
                  </div>
                </div>
              </div>

              {/* Switch active partner */}
              <button
                type="button"
                onClick={() => {
                  switchUser(partnerUser.id);
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#1a1d22] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                title={`Switch active user to ${partnerUser.name}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch to {partnerUser.name}</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-dashed border-[#e4ded5] dark:border-[#353943] bg-stone-50/50 dark:bg-[#202329]/50 text-center">
              <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                No partner has joined yet with your invite code.
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                Share code <span className="font-mono font-bold text-stone-700 dark:text-stone-300">{currentHub?.inviteCode || 'N/A'}</span> or add your partner profile directly below:
              </p>
            </div>
          )}
        </div>

        {/* Add / Connect Partner Directly (Great for setting up couple immediately with Her/Her or Her/His) */}
        {!partnerUser && (
          <form onSubmit={handleDirectAddPartner} className="p-4 rounded-xl border border-[#e4ded5] dark:border-[#2d3139] bg-[#faf8f5] dark:bg-[#202329] space-y-3">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Or Add Partner Profile Directly</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Partner's Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emma"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-xs text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Partner's Gender
                </label>
                <select
                  value={partnerGender}
                  onChange={(e) => setPartnerGender(e.target.value as UserGender)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-xs text-stone-900 dark:text-stone-100"
                >
                  <option value="female">👩 Female (She/Her)</option>
                  <option value="male">👨 Male (He/Him)</option>
                  <option value="non_binary">🌈 Non-Binary (They/Them)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Partner's Email (Optional)
              </label>
              <input
                type="email"
                placeholder="partner@example.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#1a1d22] text-xs text-stone-900 dark:text-stone-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>Connect Partner to Hub</span>
            </button>
          </form>
        )}

        {/* Join Partner's Existing Hub by Invite Code */}
        <div className="mt-4 p-4 rounded-xl border border-dashed border-[#e4ded5] dark:border-[#2d3139] bg-stone-50/50 dark:bg-[#1a1d22]">
          <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Have Your Partner's Code Instead?</span>
          </h4>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-2">
            If your partner already generated a hub code, enter it below to merge into their space:
          </p>
          <form onSubmit={handleJoinWithCode} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. DUO-1234"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="flex-1 uppercase font-mono px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-white dark:bg-[#202329] text-xs font-bold text-stone-900 dark:text-stone-100"
            />
            <button
              type="submit"
              disabled={isJoining || !joinCodeInput.trim()}
              className="px-3.5 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold text-xs rounded-lg hover:bg-stone-800 dark:hover:bg-white disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isJoining ? 'Joining...' : 'Join Hub'}
            </button>
          </form>
          {joinError && (
            <p className="text-[11px] text-rose-500 mt-1.5 font-medium">{joinError}</p>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#252830] dark:hover:bg-[#2d313a] text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
