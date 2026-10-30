import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  deleteDoc,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SharedHub, UserAccount } from '../types/auth';
import { CalendarEvent, DayStayInfo, PlanTemplate } from '../types/calendar';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if provided in config
const databaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db: Firestore = databaseId 
  ? getFirestore(app, databaseId) 
  : getFirestore(app);

/**
 * Validate Connection to Firestore on boot per skill instructions
 */
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline or connecting...');
    }
  }
}
testFirestoreConnection();

/**
 * Ensure the client has a valid Firebase Auth session
 */
export async function ensureFirebaseAuth(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  // If anonymous auth is restricted on GCP, return null safely without hanging
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hub & User Database Operations
// ---------------------------------------------------------------------------

/**
 * Create a new isolated couple hub in Firestore
 */
export async function createHubInFirestore(hub: SharedHub, user: UserAccount): Promise<void> {
  const uid = user.id;

  // Save user document
  const userToSave = {
    ...user,
    id: uid,
  };
  await setDoc(doc(db, 'users', uid), userToSave);

  // Save hub document with creator's UID in memberUids
  const hubToSave = {
    id: hub.id,
    name: hub.name,
    inviteCode: hub.inviteCode.toUpperCase(),
    memberUids: [uid],
    members: [userToSave],
    createdAt: hub.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'hubs', hub.id), hubToSave);
}

/**
 * Update an existing user in Firestore
 */
export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  const uid = user.id;
  await setDoc(doc(db, 'users', uid), user, { merge: true });
}

/**
 * Find an existing hub by partner's invite code (case-insensitive lookup, supports with or without DUO- prefix)
 */
export async function findHubByInviteCode(inviteCode: string): Promise<SharedHub | null> {
  const cleanCode = inviteCode.trim().toUpperCase();
  if (!cleanCode) return null;

  const hubsRef = collection(db, 'hubs');
  
  // Try exact match first
  let q = query(hubsRef, where('inviteCode', '==', cleanCode));
  let querySnap = await getDocs(q);

  // If not found and code does not start with DUO-, try prefixing DUO-
  if (querySnap.empty && !cleanCode.startsWith('DUO-')) {
    q = query(hubsRef, where('inviteCode', '==', `DUO-${cleanCode}`));
    querySnap = await getDocs(q);
  }

  // If still not found and code starts with DUO-, try without prefix
  if (querySnap.empty && cleanCode.startsWith('DUO-')) {
    const withoutPrefix = cleanCode.replace(/^DUO-/, '');
    q = query(hubsRef, where('inviteCode', '==', withoutPrefix));
    querySnap = await getDocs(q);
  }

  if (querySnap.empty) {
    return null;
  }

  const docSnap = querySnap.docs[0];
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    inviteCode: data.inviteCode,
    members: data.members || [],
    createdAt: data.createdAt,
  };
}

/**
 * Join an existing hub with a partner profile in Firestore
 */
export async function joinHubInFirestore(hubId: string, partnerUser: UserAccount): Promise<SharedHub> {
  const uid = partnerUser.id;

  const partnerToSave = {
    ...partnerUser,
    id: uid,
    hubId,
    role: 'partner' as const,
  };
  await setDoc(doc(db, 'users', uid), partnerToSave);

  // Read current hub to append partner
  const hubRef = doc(db, 'hubs', hubId);
  const hubSnap = await getDoc(hubRef);

  if (!hubSnap.exists()) {
    throw new Error('Hub does not exist');
  }

  const hubData = hubSnap.data();
  const currentMembers: UserAccount[] = hubData.members || [];
  const currentUids: string[] = hubData.memberUids || [];

  const alreadyMember = currentMembers.some((m) => m.email.toLowerCase() === partnerUser.email.toLowerCase());
  const updatedMembers = alreadyMember
    ? currentMembers.map((m) => (m.email.toLowerCase() === partnerUser.email.toLowerCase() ? partnerToSave : m))
    : [...currentMembers, partnerToSave];

  const updatedUids = Array.from(new Set([...currentUids, uid]));

  await updateDoc(hubRef, {
    members: updatedMembers,
    memberUids: updatedUids,
    updatedAt: new Date().toISOString(),
  });

  return {
    id: hubId,
    name: hubData.name,
    inviteCode: hubData.inviteCode,
    members: updatedMembers,
    createdAt: hubData.createdAt,
  };
}

/**
 * Update Hub properties (e.g. name) in Firestore
 */
export async function updateHubInFirestore(hubId: string, updates: Partial<SharedHub>): Promise<void> {
  const hubRef = doc(db, 'hubs', hubId);
  await updateDoc(hubRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Subscribe to Hub document real-time changes
 */
export function subscribeToHub(hubId: string, onUpdate: (hub: SharedHub) => void) {
  const hubRef = doc(db, 'hubs', hubId);
  return onSnapshot(hubRef, (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      onUpdate({
        id: snap.id,
        name: d.name,
        inviteCode: d.inviteCode,
        members: d.members || [],
        createdAt: d.createdAt,
      });
    }
  }, (err) => {
    console.warn('Hub subscription error:', err);
  });
}

// ---------------------------------------------------------------------------
// Real-time Isolated Events Synchronization
// ---------------------------------------------------------------------------

/**
 * Normalizes date values from Firestore (Timestamps, Dates, or strings) to YYYY-MM-DD
 */
export function normalizeDateString(val: any): string {
  if (!val) return '';
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString().split('T')[0];
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  return String(val || '');
}

export function subscribeToEvents(hubId: string, onUpdate: (events: CalendarEvent[]) => void) {
  const eventsCol = collection(db, 'hubs', hubId, 'events');
  return onSnapshot(eventsCol, (snap) => {
    const list: CalendarEvent[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const rawDate = data.startDate || data.date;
      const normalizedStartDate = normalizeDateString(rawDate);
      const evt: CalendarEvent = {
        ...(data as CalendarEvent),
        id: docSnap.id || data.id,
        startDate: normalizedStartDate,
        ...(data.endDate ? { endDate: normalizeDateString(data.endDate) } : {})
      };
      list.push(evt);
    });
    onUpdate(list);
  }, (err) => {
    console.warn('Events subscription error:', err);
  });
}

export async function saveEventToFirestore(hubId: string, event: CalendarEvent): Promise<void> {
  const eventRef = doc(db, 'hubs', hubId, 'events', event.id);
  await setDoc(eventRef, {
    ...event,
    hubId,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteEventFromFirestore(hubId: string, eventId: string): Promise<void> {
  const eventRef = doc(db, 'hubs', hubId, 'events', eventId);
  await deleteDoc(eventRef);
}

// ---------------------------------------------------------------------------
// Real-time Isolated Stays Synchronization (Hers / His / Home)
// ---------------------------------------------------------------------------

export function subscribeToStays(hubId: string, onUpdate: (stays: Record<string, DayStayInfo>) => void) {
  const staysCol = collection(db, 'hubs', hubId, 'stays');
  return onSnapshot(staysCol, (snap) => {
    const map: Record<string, DayStayInfo> = {};
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const rawDate = d.date || docSnap.id;
      const normalizedDate = normalizeDateString(rawDate);
      map[normalizedDate] = {
        ...(d as DayStayInfo),
        date: normalizedDate,
      };
    });
    onUpdate(map);
  }, (err) => {
    console.warn('Stays subscription error:', err);
  });
}

export async function saveStayToFirestore(hubId: string, stay: DayStayInfo): Promise<void> {
  const stayRef = doc(db, 'hubs', hubId, 'stays', stay.date);
  await setDoc(stayRef, {
    ...stay,
    hubId,
    updatedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Real-time Isolated Templates Synchronization
// ---------------------------------------------------------------------------

export function subscribeToTemplates(hubId: string, onUpdate: (templates: PlanTemplate[]) => void) {
  const tmplCol = collection(db, 'hubs', hubId, 'templates');
  return onSnapshot(tmplCol, (snap) => {
    const list: PlanTemplate[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as PlanTemplate);
    });
    if (list.length > 0) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      onUpdate(list);
    }
  }, (err) => {
    console.warn('Templates subscription error:', err);
  });
}

export async function saveTemplateToFirestore(hubId: string, template: PlanTemplate): Promise<void> {
  const tmplRef = doc(db, 'hubs', hubId, 'templates', template.id);
  await setDoc(tmplRef, {
    ...template,
    hubId,
  });
}

export async function deleteTemplateFromFirestore(hubId: string, templateId: string): Promise<void> {
  const tmplRef = doc(db, 'hubs', hubId, 'templates', templateId);
  await deleteDoc(tmplRef);
}

// ---------------------------------------------------------------------------
// Real-time Shared Couple Chat Synchronization
// ---------------------------------------------------------------------------

export interface SharedChatMessageItem {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  source: 'app' | 'google_chat';
  createdAt?: string;
}

export function subscribeToMessages(hubId: string, onUpdate: (messages: SharedChatMessageItem[]) => void) {
  const msgCol = collection(db, 'hubs', hubId, 'messages');
  return onSnapshot(msgCol, (snap) => {
    const list: SharedChatMessageItem[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as SharedChatMessageItem);
    });
    list.sort((a, b) => ((a.createdAt || '') > (b.createdAt || '') ? 1 : -1));
    onUpdate(list);
  }, (err) => {
    console.warn('Messages subscription error:', err);
  });
}

export async function sendMessageToFirestore(hubId: string, message: SharedChatMessageItem): Promise<void> {
  const authUser = await ensureFirebaseAuth().catch(() => null);
  const uid = authUser?.uid || 'user-anonymous';

  const msgRef = doc(db, 'hubs', hubId, 'messages', message.id);
  await setDoc(msgRef, {
    ...message,
    hubId,
    senderId: uid,
    createdAt: message.createdAt || new Date().toISOString(),
  });
}
