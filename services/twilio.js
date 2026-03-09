/**
 * PROPABRIDGE — Twilio Notifications Service
 * WhatsApp + SMS outreach pipeline
 * Handles sandbox mode gracefully
 */

let client = null;

function getClient() {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token || sid.startsWith('ACxx')) {
    console.warn('⚠️  Twilio not configured — WhatsApp/SMS will be logged but not sent');
    return null;
  }

  try {
    const twilio = require('twilio');
    client = twilio(sid, token);
    console.log('✅ Twilio client initialized');
    return client;
  } catch (err) {
    console.warn('⚠️  Twilio init failed:', err.message);
    return null;
  }
}

// ─── Format Nigerian phone numbers ───────────────────────────────────────────
function formatNigerianPhone(phone) {
  if (!phone) return null;
  let clean = phone.replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('0') && clean.length === 11) return '+234' + clean.slice(1);
  if (clean.startsWith('234') && !clean.startsWith('+')) return '+' + clean;
  if (clean.startsWith('+')) return clean;
  return '+234' + clean;
}

// ─── Send WhatsApp message ────────────────────────────────────────────────────
async function sendWhatsApp(phone, message) {
  const to = formatNigerianPhone(phone);
  if (!to) throw new Error('Invalid phone number');

  const twilioClient = getClient();
  if (!twilioClient) {
    console.log(`[WhatsApp Mock] To: ${to}\n${message}\n---`);
    return { sid: 'mock_' + Date.now(), status: 'mock_sent' };
  }

  return await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
    to: `whatsapp:${to}`,
  });
}

// ─── Send SMS ─────────────────────────────────────────────────────────────────
async function sendSMS(phone, message) {
  const to = formatNigerianPhone(phone);
  if (!to) throw new Error('Invalid phone number');

  const twilioClient = getClient();
  if (!twilioClient) {
    console.log(`[SMS Mock] To: ${to}\n${message}\n---`);
    return { sid: 'mock_' + Date.now(), status: 'mock_sent' };
  }

  return await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_SMS_NUMBER,
    to,
  });
}

// ─── Message Templates ────────────────────────────────────────────────────────
const templates = {

  leadWelcome: (name, location, budget) => `
Hi ${name || 'there'} 👋

Thanks for reaching out on *Propabridge*!

I'm putting together your personalized list of verified properties${location ? ` in *${location}*` : ''}${budget ? ` within *${budget}*` : ''}.

✅ Every property on Propabridge is fraud-checked and agent-verified.

I'll send your shortlist shortly. In the meantime, you can browse:
🔗 propabridge.com

— Propa, your AI property guide
`.trim(),

  newPropertyMatch: (name, property) => `
Hi ${name} 🏠

*New match just listed!*

*${property.title}*
💰 ${property.price_label}
📍 ${property.neighborhood}, Abuja
🛏 ${property.bedrooms} bedrooms | ✅ Verified

${property.images?.[0] ? property.images[0] : ''}

Interested? Reply *VIEW* to book a visit or *MORE* to see details.

— Propabridge
`.trim(),

  viewingConfirmation: (name, property, date, time, agentName) => `
✅ *Viewing Confirmed!*

Hi ${name}, your property viewing is booked:

🏠 *${property.title}*
📍 ${property.address}
📅 *${date}*
⏰ *${time}*
👤 Agent: ${agentName}
📞 Agent phone: ${property.agent_phone}

*What to bring:* Valid ID and any previous tenancy documents.

Reply *CANCEL* to cancel or *RESCHEDULE* to change the time.

— Propabridge 🏠
propabridge.com
`.trim(),

  viewingReminder24h: (name, property, time, address) => `
Hi ${name} ⏰

*Reminder:* Your property viewing is *TOMORROW* at *${time}*

🏠 ${property.title}
📍 ${address}

Need directions? Reply *DIRECTIONS* and I'll send a Google Maps link.
Need to reschedule? Reply *RESCHEDULE*.

See you tomorrow! 😊

— Propabridge
`.trim(),

  viewingReminder1h: (name, propertyTitle, time, address) => `
Hi ${name}! Your viewing is in *1 hour* ⏰

📍 *${address}*
⏰ ${time}

Safe travels — see you soon!

— Propabridge 🏠
`.trim(),

  postViewing: (name, propertyTitle) => `
Hi ${name} 😊

Hope your viewing of *${propertyTitle}* went well!

What did you think? Reply:
1️⃣ *INTERESTED* — I want to proceed
2️⃣ *MAYBE* — I need to think about it
3️⃣ *NOT FOR ME* — Show me other options

Your feedback helps us find your perfect home faster!

— Propabridge 🏠
`.trim(),

  hotLeadAlert: (lead) => `
🔥 *HOT LEAD ALERT — Propabridge*

Name: ${lead.name || 'Unknown'}
Phone: ${lead.phone}
Budget: ${lead.budget || 'Not specified'}
Location: ${lead.location_preference || 'Not specified'}
Intent: ${lead.intent || 'unknown'}
Score: ${lead.score}/100

Session: ${lead.session_id}
Time: ${new Date().toLocaleString('en-NG')}

→ Check admin dashboard: ${process.env.APP_BASE_URL}/admin/leads/${lead.id}
`.trim(),

  weeklyNurture: (name, area, averagePrice) => `
Hi ${name} 👋

*This week's Propabridge update for ${area}:*

📊 Average rent: *${averagePrice}*
🆕 New verified listings this week: 8
🔥 Most searched: 3-bedroom flats

Your saved search is still active — we're watching for new matches!

Browse latest: propabridge.com/properties?location=${encodeURIComponent(area)}

— Propabridge 🏠
`.trim(),

};

module.exports = { sendWhatsApp, sendSMS, formatNigerianPhone, templates };
