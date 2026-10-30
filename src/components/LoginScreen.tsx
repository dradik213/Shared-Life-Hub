import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserGender } from '../types/auth';
import { Heart, LogIn, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';

export const PROFILE_COLORS = [
  { name: 'Blue', class: 'bg-blue-600' },
  { name: 'Purple', class: 'bg-purple-600' },
  { name: 'Indigo', class: 'bg-indigo-600' },
  { name: 'Sky Blue', class: 'bg-sky-600' },
  { name: 'Teal', class: 'bg-teal-600' },
  { name: 'Emerald', class: 'bg-emerald-600' },
  { name: 'Warm Amber', class: 'bg-amber-600' },
  { name: 'Coral Rose', class: 'bg-rose-600' },
  { name: 'Crimson', class: 'bg-red-600' },
  { name: 'Fuchsia', class: 'bg-fuchsia-600' },
  { name: 'Midnight', class: 'bg-stone-900' },
];

interface LoginScreenProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ isDarkMode = false }) => {
  const { login, register } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Sign Up state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<UserGender>('female');
  const [customPronoun, setCustomPronoun] = useState('');
  const [hubAction, setHubAction] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');
  const [hubName, setHubName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically read invite link query parameters (e.g., ?hub=DUO-1234 or ?invite=DUO-1234)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('hub') || params.get('invite');
      if (code) {
        setMode('signup');
        setHubAction('join');
        setInviteCode(code.trim().toUpperCase());
      }
    } catch (e) {}
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.trim()) {
      setError('Please enter your email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await login(loginEmail);
      if (!res.success) {
        setError(res.error || 'Login failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your name or nickname.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (hubAction === 'join' && !inviteCode.trim()) {
      setError("Please enter your partner's invite code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        name,
        email,
        gender,
        customPronoun: gender === 'other' ? customPronoun : undefined,
        hubChoice: hubAction,
        inviteCode: hubAction === 'join' ? inviteCode.trim() : undefined,
        hubName: hubName.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#14161a] text-[#f3f1ec]' : 'bg-[#f7f4ed] text-[#2b2927]'} flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200`}>
      
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md mb-2.5">
          <Heart className="w-5 h-5 fill-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          DuoSync
        </h1>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#1a1d22] border border-[#e4ded5] dark:border-[#2d3139] rounded-2xl p-6 sm:p-7 shadow-xl">
        
        {/* Tab switch: Sign In vs Create Account */}
        <div className="flex p-1 bg-stone-100 dark:bg-[#242830] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin'
                ? 'bg-white dark:bg-[#16181c] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#16181c] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-stone-900 hover:bg-stone-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Signing in...' : 'Sign In to Hub'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Your Name or Nickname
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            {/* Compact Pronoun Selection */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Pronouns
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    gender === 'female'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-400 ring-1 ring-purple-500 font-semibold text-purple-900 dark:text-purple-200'
                      : 'border-[#e4ded5] dark:border-[#353943] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span className="text-xs">She / Her</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    gender === 'male'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-400 ring-1 ring-blue-500 font-semibold text-blue-900 dark:text-blue-200'
                      : 'border-[#e4ded5] dark:border-[#353943] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span className="text-xs">He / Him</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('non_binary')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    gender === 'non_binary'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-400 ring-1 ring-emerald-500 font-semibold text-emerald-900 dark:text-emerald-200'
                      : 'border-[#e4ded5] dark:border-[#353943] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span className="text-xs">They / Them</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('other')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    gender === 'other'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-400 ring-1 ring-amber-500 font-semibold text-amber-900 dark:text-amber-200'
                      : 'border-[#e4ded5] dark:border-[#353943] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span className="text-xs">Custom</span>
                </button>
              </div>

              {gender === 'other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter pronoun (e.g. Ze, Them)"
                    value={customPronoun}
                    onChange={(e) => setCustomPronoun(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-xs text-stone-900 dark:text-stone-100"
                  />
                </div>
              )}
            </div>

            {/* Hub Setup: Start Hub vs Join Hub */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Shared Hub Setup
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setHubAction('create')}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                    hubAction === 'create'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-950 dark:text-purple-200 font-semibold shadow-2xs'
                      : 'border-[#e4ded5] dark:border-[#353943] text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Start Hub
                </button>
                <button
                  type="button"
                  onClick={() => setHubAction('join')}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                    hubAction === 'join'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-950 dark:text-purple-200 font-semibold shadow-2xs'
                      : 'border-[#e4ded5] dark:border-[#353943] text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Join Hub
                </button>
              </div>

              {hubAction === 'create' ? (
                <div>
                  <input
                    type="text"
                    placeholder="Hub Name (e.g. Our Shared Nest)"
                    value={hubName}
                    onChange={(e) => setHubName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-xs text-stone-900 dark:text-stone-100"
                  />
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    You will receive an invite code to share with your partner anytime.
                  </p>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Partner's Invite Code (e.g. DUO-7842)"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e4ded5] dark:border-[#353943] bg-[#faf8f5] dark:bg-[#202329] text-xs font-mono uppercase text-stone-900 dark:text-stone-100"
                  />
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    Enter your partner's 8-character DuoSync invite code.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Creating account...'
                  : hubAction === 'create'
                  ? 'Create Account & Start Hub'
                  : 'Create Account & Join Hub'}
              </span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
