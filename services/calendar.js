/**
 * PROPABRIDGE — Google Calendar Service
 * Creates and manages property viewing appointments
 * Gracefully handles missing/invalid credentials
 */

let calendar = null;
let calendarAvailable = false;

function getCalendarClient() {
  if (calendar) return calendar;

  try {
    const { google } = require('googleapis');

    // Try service account first (for Cloud Run with default credentials)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const fs = require('fs');
      if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        const auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        calendar = google.calendar({ version: 'v3', auth });
        calendarAvailable = true;
        console.log('✅ Google Calendar connected (service account)');
        return calendar;
      }
    }

    // Try OAuth if refresh token is available
    if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CALENDAR_CLIENT_ID,
        process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
        process.env.GOOGLE_CALENDAR_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
      });
      calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      calendarAvailable = true;
      console.log('✅ Google Calendar connected (OAuth)');
      return calendar;
    }

    throw new Error('No calendar credentials available');
  } catch (err) {
    console.warn(`⚠️  Google Calendar not available: ${err.message}`);
    console.warn('   Viewings will be saved to DB without calendar events');
    calendarAvailable = false;
    return null;
  }
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// ─── Create a viewing appointment ────────────────────────────────────────────
async function createViewingEvent({ lead, property, date, time }) {
  const cal = getCalendarClient();
  if (!cal) {
    console.log(`[Calendar Mock] Viewing: ${property.title} for ${lead.name || 'Unknown'} on ${date} at ${time}`);
    return { event_id: 'mock_' + Date.now(), event_link: null, start: date, end: date };
  }

  const startDateTime = parseDateTime(date, time);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  const event = {
    summary: `🏠 Propabridge Viewing: ${property.title}`,
    description: `
Property: ${property.title}
Address: ${property.address}
Price: ${property.price_label}

Lead: ${lead.name || 'Unknown'}
Phone: ${lead.phone}
Email: ${lead.email || 'N/A'}
Budget: ${lead.budget || 'N/A'}

---
Propabridge verified property viewing
propabridge.com
    `.trim(),
    location: property.address,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Africa/Lagos',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Africa/Lagos',
    },
    attendees: [
      ...(lead.email ? [{ email: lead.email, displayName: lead.name || 'Lead' }] : []),
      ...(process.env.ADMIN_EMAIL ? [{ email: process.env.ADMIN_EMAIL, displayName: 'Propabridge Agent' }] : []),
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
    colorId: '9',
  };

  const response = await cal.events.insert({
    calendarId: CALENDAR_ID,
    resource: event,
    sendUpdates: 'all',
  });

  return {
    event_id: response.data.id,
    event_link: response.data.htmlLink,
    start: response.data.start.dateTime,
    end: response.data.end.dateTime,
  };
}

// ─── Update/cancel a viewing ─────────────────────────────────────────────────
async function cancelViewingEvent(eventId) {
  const cal = getCalendarClient();
  if (!cal) return { cancelled: true, eventId, mock: true };
  await cal.events.delete({ calendarId: CALENDAR_ID, eventId, sendUpdates: 'all' });
  return { cancelled: true, eventId };
}

// ─── Get available slots for a given day ─────────────────────────────────────
async function getAvailableSlots(date) {
  const cal = getCalendarClient();
  if (!cal) {
    // Return default slots when calendar not available
    return ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']
      .map(time => ({ time, available: true }));
  }

  const startOfDay = new Date(`${date}T07:00:00+01:00`);
  const endOfDay = new Date(`${date}T19:00:00+01:00`);

  const response = await cal.freebusy.query({
    resource: {
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      timeZone: 'Africa/Lagos',
      items: [{ id: CALENDAR_ID }],
    },
  });

  const busy = response.data.calendars[CALENDAR_ID]?.busy || [];

  const allSlots = [];
  for (let hour = 8; hour <= 17; hour++) {
    const slotStart = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+01:00`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    const isBooked = busy.some(b => {
      const busyStart = new Date(b.start);
      const busyEnd = new Date(b.end);
      return slotStart < busyEnd && slotEnd > busyStart;
    });

    allSlots.push({
      time: slotStart.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true }),
      available: !isBooked,
    });
  }

  return allSlots;
}

// ─── Parse date and time string ───────────────────────────────────────────────
function parseDateTime(date, time) {
  const dateStr = date;
  let hours = 9, minutes = 0;

  if (time) {
    const clean = time.toLowerCase().replace(/\s/g, '');
    const pmMatch = clean.match(/(\d+)(?::(\d+))?pm/);
    const amMatch = clean.match(/(\d+)(?::(\d+))?am/);
    const plainMatch = clean.match(/^(\d+):(\d+)$/);

    if (pmMatch) {
      hours = parseInt(pmMatch[1]);
      minutes = parseInt(pmMatch[2] || '0');
      if (hours !== 12) hours += 12;
    } else if (amMatch) {
      hours = parseInt(amMatch[1]);
      minutes = parseInt(amMatch[2] || '0');
      if (hours === 12) hours = 0;
    } else if (plainMatch) {
      hours = parseInt(plainMatch[1]);
      minutes = parseInt(plainMatch[2]);
    }
  }

  return new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+01:00`);
}

// ─── Calendar status ─────────────────────────────────────────────────────────
function isCalendarAvailable() {
  return calendarAvailable;
}

module.exports = { createViewingEvent, cancelViewingEvent, getAvailableSlots, isCalendarAvailable };
