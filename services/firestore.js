/**
 * PROPABRIDGE — Firestore Database Service
 * With in-memory fallback when Firebase is not configured
 */

const admin = require('firebase-admin');

let db = null;
let useInMemory = false;

// ─── In-Memory Store (fallback when Firestore unavailable) ───────────────────
const memoryStore = {
  sessions: new Map(),
  leads: new Map(),
  properties: new Map(),
  appointments: new Map(),
};

function getDB() {
  if (db) return db;
  if (useInMemory) return null;

  try {
    if (!admin.apps.length) {
      // Check if running on GCP (Cloud Run provides default credentials)
      if (process.env.GOOGLE_CLOUD_PROJECT && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const fs = require('fs');
        if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
          });
        } else {
          throw new Error('serviceAccountKey.json not found');
        }
      } else {
        throw new Error('No Firebase credentials configured');
      }
    }
    db = admin.firestore();
    console.log('✅ Connected to Firestore');
    return db;
  } catch (err) {
    console.warn(`⚠️  Firestore not available: ${err.message}`);
    console.warn('   Using in-memory storage (data will not persist across restarts)');
    useInMemory = true;
    return null;
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

async function createSession(sessionId) {
  const session = {
    session_id: sessionId,
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
    message_count: 0,
    history: [],
    lead: null,
    stage: 'greeting',
    properties_shown: [],
    appointment_id: null,
  };

  const firestore = getDB();
  if (firestore) {
    await firestore.collection('sessions').doc(sessionId).set(session);
  } else {
    memoryStore.sessions.set(sessionId, session);
  }
  return session;
}

async function getSession(sessionId) {
  const firestore = getDB();
  if (firestore) {
    const doc = await firestore.collection('sessions').doc(sessionId).get();
    return doc.exists ? doc.data() : null;
  }
  return memoryStore.sessions.get(sessionId) || null;
}

async function updateSession(sessionId, updates) {
  const firestore = getDB();
  if (firestore) {
    await firestore.collection('sessions').doc(sessionId).set(
      { ...updates, last_active: new Date().toISOString() },
      { merge: true }
    );
  } else {
    const existing = memoryStore.sessions.get(sessionId) || {};
    memoryStore.sessions.set(sessionId, {
      ...existing,
      ...updates,
      last_active: new Date().toISOString(),
    });
  }
}

async function addMessageToSession(sessionId, role, text) {
  const firestore = getDB();
  if (firestore) {
    const ref = firestore.collection('sessions').doc(sessionId);
    await firestore.runTransaction(async (t) => {
      const doc = await t.get(ref);
      const data = doc.data() || {};
      const history = data.history || [];
      history.push({ role, text, timestamp: new Date().toISOString() });
      const trimmed = history.slice(-100);
      t.set(ref, {
        history: trimmed,
        message_count: (data.message_count || 0) + 1,
        last_active: new Date().toISOString(),
      }, { merge: true });
    });
  } else {
    const session = memoryStore.sessions.get(sessionId) || {
      session_id: sessionId, history: [], message_count: 0,
    };
    session.history = session.history || [];
    session.history.push({ role, text, timestamp: new Date().toISOString() });
    if (session.history.length > 100) session.history = session.history.slice(-100);
    session.message_count = (session.message_count || 0) + 1;
    session.last_active = new Date().toISOString();
    memoryStore.sessions.set(sessionId, session);
  }
}

// ─── Leads ────────────────────────────────────────────────────────────────────

async function saveLead(lead) {
  const firestore = getDB();
  if (firestore) {
    const ref = firestore.collection('leads').doc(lead.id || firestore.collection('leads').doc().id);
    await ref.set({ ...lead, created_at: new Date().toISOString() }, { merge: true });
    return ref.id;
  }
  const id = lead.id || `lead_${Date.now()}`;
  memoryStore.leads.set(id, { ...lead, id, created_at: new Date().toISOString() });
  return id;
}

async function getLeads({ status, limit = 50 } = {}) {
  const firestore = getDB();
  if (firestore) {
    let q = firestore.collection('leads').orderBy('created_at', 'desc').limit(limit);
    if (status) q = q.where('status', '==', status);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  let results = Array.from(memoryStore.leads.values());
  if (status) results = results.filter(l => l.status === status);
  return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
}

async function updateLead(leadId, updates) {
  const firestore = getDB();
  if (firestore) {
    await firestore.collection('leads').doc(leadId).set(
      { ...updates, updated_at: new Date().toISOString() },
      { merge: true }
    );
  } else {
    const existing = memoryStore.leads.get(leadId) || {};
    memoryStore.leads.set(leadId, {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }
}

// ─── Properties ───────────────────────────────────────────────────────────────

async function getProperties(filters = {}) {
  const firestore = getDB();
  if (!firestore) throw new Error('Firestore not available — using sample data');

  let q = firestore.collection('properties').where('verified', '==', true);
  if (filters.type) q = q.where('type', '==', filters.type);
  if (filters.bedrooms) q = q.where('bedrooms', '==', parseInt(filters.bedrooms));
  if (filters.neighborhood) q = q.where('neighborhood', '==', filters.neighborhood);
  q = q.limit(filters.limit || 20);
  const snap = await q.get();
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (filters.maxPrice) results = results.filter(p => p.price <= filters.maxPrice);
  if (filters.minPrice) results = results.filter(p => p.price >= filters.minPrice);

  return results;
}

async function getProperty(id) {
  const firestore = getDB();
  if (!firestore) throw new Error('Firestore not available');
  const doc = await firestore.collection('properties').doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

async function saveAppointment(appt) {
  const firestore = getDB();
  if (firestore) {
    const ref = firestore.collection('appointments').doc();
    const data = { ...appt, id: ref.id, created_at: new Date().toISOString(), status: 'confirmed' };
    await ref.set(data);
    return data;
  }
  const id = `appt_${Date.now()}`;
  const data = { ...appt, id, created_at: new Date().toISOString(), status: 'confirmed' };
  memoryStore.appointments.set(id, data);
  return data;
}

async function getAppointments({ leadId, status } = {}) {
  const firestore = getDB();
  if (firestore) {
    let q = firestore.collection('appointments').orderBy('created_at', 'desc');
    if (leadId) q = q.where('lead_id', '==', leadId);
    if (status) q = q.where('status', '==', status);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  let results = Array.from(memoryStore.appointments.values());
  if (leadId) results = results.filter(a => a.lead_id === leadId);
  if (status) results = results.filter(a => a.status === status);
  return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// ─── Storage mode info ───────────────────────────────────────────────────────
function getStorageMode() {
  return useInMemory ? 'in-memory' : 'firestore';
}

module.exports = {
  getDB,
  getStorageMode,
  createSession, getSession, updateSession, addMessageToSession,
  saveLead, getLeads, updateLead,
  getProperties, getProperty,
  saveAppointment, getAppointments,
};
