import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with all requested Workspace scopes
export const googleProvider = new GoogleAuthProvider();

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.create',
  'https://www.googleapis.com/auth/chat.messages.readonly',
];

WORKSPACE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// In-memory access token storage per security guidelines (never in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    console.error('Google Sign In Error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const signOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// -------------------------------------------------------------
// Google Calendar API
// -------------------------------------------------------------
export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
}

export async function fetchGoogleCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEventItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const now = new Date();
  const defaultMin = timeMin || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const defaultMax = timeMax || new Date(now.getFullYear(), now.getMonth() + 2, 28).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    defaultMin
  )}&timeMax=${encodeURIComponent(defaultMax)}&singleEvents=true&orderBy=startTime&maxResults=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createGoogleCalendarEvent(eventData: {
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
}): Promise<GoogleCalendarEventItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create Google Calendar event (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// -------------------------------------------------------------
// Google Tasks API
// -------------------------------------------------------------
export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export async function fetchGoogleTasks(): Promise<GoogleTaskItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  // First fetch primary tasklist
  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listsRes.ok) {
    const err = await listsRes.text();
    throw new Error(`Google Tasks API list error: ${err}`);
  }

  const listsData = await listsRes.json();
  const defaultList = listsData.items?.[0]?.id || '@default';

  // Fetch tasks
  const tasksRes = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(defaultList)}/tasks?showCompleted=false&showHidden=false&maxResults=50`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!tasksRes.ok) {
    const err = await tasksRes.text();
    throw new Error(`Google Tasks API items error: ${err}`);
  }

  const tasksData = await tasksRes.json();
  return (tasksData.items || []).map((t: any) => ({
    id: t.id,
    title: t.title || 'Untitled Task',
    notes: t.notes,
    status: t.status,
    due: t.due,
    updated: t.updated,
  }));
}

export async function createGoogleTask(title: string, notes?: string, due?: string): Promise<GoogleTaskItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      notes,
      due,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Google Task: ${err}`);
  }

  return await res.json();
}

// -------------------------------------------------------------
// Gmail API
// -------------------------------------------------------------
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

export async function fetchRecentGmailMessages(maxResults = 10): Promise<GmailMessageSummary[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:INBOX`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Gmail API list error: ${err}`);
  }

  const listData = await listRes.json();
  const messages = listData.messages || [];

  const summaries: GmailMessageSummary[] = [];

  for (const m of messages) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        const headers: any[] = msgData.payload?.headers || [];
        const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find((h) => h.name === 'Date')?.value || '';

        summaries.push({
          id: m.id,
          threadId: m.threadId,
          subject,
          from,
          date,
          snippet: msgData.snippet || '',
        });
      }
    } catch (e) {
      console.warn('Error reading message detail', e);
    }
  }

  return summaries;
}

// -------------------------------------------------------------
// Google Chat API
// -------------------------------------------------------------
export interface GoogleChatSpaceItem {
  name: string;
  displayName: string;
  type: string;
}

export async function fetchGoogleChatSpaces(): Promise<GoogleChatSpaceItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    // Return friendly error or empty list if consumer account / app not configured yet
    console.warn(`Chat API response (${res.status}): ${err}`);
    throw new Error(`Chat API error: ${err}`);
  }

  const data = await res.json();
  return (data.spaces || []).map((s: any) => ({
    name: s.name,
    displayName: s.displayName || 'Direct Message',
    type: s.spaceType || s.type || 'SPACE',
  }));
}

export async function sendGoogleChatMessage(spaceName: string, text: string): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to send Google Chat message: ${err}`);
  }

  return await res.json();
}
