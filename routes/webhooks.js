/**
 * PROPABRIDGE — WhatsApp Webhook Handler
 * Receives inbound WhatsApp messages from Twilio,
 * processes them through Propa AI, and replies back on WhatsApp.
 *
 * Twilio calls this endpoint when a user messages the WhatsApp number.
 */

const router = require('express').Router();
const { chat } = require('../services/gemini');
const { sendWhatsApp, formatNigerianPhone } = require('../services/twilio');
const { getSession, createSession, addMessageToSession, updateSession } = require('../services/db');

// In-memory rate limiting (per phone number)
const lastMessage = new Map(); // phone -> timestamp
const RATE_LIMIT_MS = 2000; // 2 seconds minimum between messages

/**
 * @swagger
 * /api/webhooks/whatsapp:
 *   post:
 *     tags: [📱 WhatsApp]
 *     summary: Receive inbound WhatsApp messages from Twilio (webhook)
 *     description: |
 *       Twilio calls this endpoint automatically whenever someone sends a WhatsApp
 *       message to your Propabridge number. This processes the message through
 *       Propa AI and sends the response back via WhatsApp.
 *
 *       **Set this as your Twilio Sandbox Webhook URL:**
 *       `https://propabridge-api-480235407496.us-central1.run.app/api/webhooks/whatsapp`
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               From:
 *                 type: string
 *                 example: "whatsapp:+2348056419040"
 *               Body:
 *                 type: string
 *                 example: "I want a 3 bedroom flat in Gwarinpa"
 *               To:
 *                 type: string
 *                 example: "whatsapp:+14155238886"
 *     responses:
 *       200:
 *         description: Webhook received and processed
 */
router.post('/whatsapp', async (req, res) => {
    try {
        // Twilio webhook sends form data
        const fromRaw = req.body.From || '';        // e.g. "whatsapp:+2348056419040"
        const body = (req.body.Body || '').trim();  // user's message text
        const toNumber = req.body.To || '';         // our Propabridge WhatsApp number
        const numMedia = parseInt(req.body.NumMedia || '0');

        // Extract clean phone number
        const phone = fromRaw.replace('whatsapp:', '');
        const sessionId = `wa_${phone.replace(/\+/g, '')}`;

        console.log(`[WhatsApp In] From: ${phone} | Message: "${body.substring(0, 80)}"`);

        // Always respond 200 quickly so Twilio doesn't retry
        res.status(200).send('<Response></Response>');

        // Rate limit guard
        const now = Date.now();
        const last = lastMessage.get(phone) || 0;
        if (now - last < RATE_LIMIT_MS) return;
        lastMessage.set(phone, now);

        // Skip empty or media-only messages
        if (!body && numMedia > 0) {
            await sendWhatsApp(phone, "Sorry, I can only handle text messages right now. Please type your property request 🏠");
            return;
        }
        if (!body) return;

        // Handle special commands
        if (['hi', 'hello', 'start', 'hey', 'hii'].includes(body.toLowerCase())) {
            await sendWhatsApp(phone, `Hi there! 👋 I'm *Propa*, your AI property concierge from *Propabridge* 🏠

Nigeria's most trusted fraud-free property platform!

I can help you:
🔍 Find verified properties in Abuja
📅 Book property viewings
💬 Answer any property questions

Just tell me what you're looking for — area, budget, bedrooms — and I'll find you the perfect match!

What kind of property are you looking for?`);
            return;
        }

        if (body.toUpperCase() === 'STOP') {
            await sendWhatsApp(phone, "You've been unsubscribed from Propabridge updates. Send 'START' any time to resume. 👋");
            return;
        }

        if (body.toUpperCase() === 'HELP') {
            await sendWhatsApp(phone, `*Propabridge — Propa AI Help* 🏠

Here are some things you can ask me:

🔍 *Search:*
_"3 bedroom flat in Gwarinpa under ₦2.5M"_
_"Buy a duplex in Jabi around ₦150M"_
_"Serviced apartments in Maitama"_

📅 *Book a viewing:*
_"I want to see this property"_
_"Book a viewing for Saturday"_

📞 *Other:*
Type *STOP* to unsubscribe
Type *RESET* to start a new conversation

What property are you looking for?`);
            return;
        }

        if (body.toUpperCase() === 'RESET') {
            await updateSession(sessionId, { history: [], stage: 'greeting', lead: null, properties_shown: [] });
            await sendWhatsApp(phone, "✅ Conversation reset! I'm Propa, your AI property guide. What are you looking for? 🏠");
            return;
        }

        // Get or create session (keyed by phone number — persists across conversations)
        let session = await getSession(sessionId);
        if (!session) {
            session = await createSession(sessionId);
            await updateSession(sessionId, {
                phone,
                channel: 'whatsapp',
                from_number: fromRaw,
                provider_number: toNumber,
            });
        }

        // Add user message to history
        await addMessageToSession(sessionId, 'user', body);

        // Fetch conversation history
        const freshSession = await getSession(sessionId);
        const history = (freshSession?.history || []).slice(-30); // last 30 messages

        // Call Propa AI
        const aiResponse = await chat({
            message: body,
            history: history.slice(0, -1), // history before this message
            sessionId,
            sessionData: freshSession || {},
        });

        const reply = aiResponse.reply || "I'm having a moment — please repeat your question!";

        // Add AI reply to history
        await addMessageToSession(sessionId, 'model', reply);

        // Update session stage
        if (aiResponse.sessionStage) {
            await updateSession(sessionId, { stage: aiResponse.sessionStage });
        }

        // Send the AI reply
        await sendWhatsApp(phone, formatWhatsAppReply(reply));

        // If AI found properties, send them as separate messages
        const propertiesFound = aiResponse.propertiesToShow || aiResponse.properties_to_show || [];
        if (propertiesFound.length > 0) {
            await new Promise(r => setTimeout(r, 800)); // small delay between messages

            const propMessages = propertiesFound.slice(0, 3).map((p, i) => formatPropertyCard(p, i + 1));
            for (const msg of propMessages) {
                await sendWhatsApp(phone, msg);
                await new Promise(r => setTimeout(r, 500));
            }

            await sendWhatsApp(phone, "💬 Reply with the property number (1, 2, or 3) to get more details or book a viewing!\n\n_All properties are verified ✅ by Propabridge_");
        }

        // If lead was captured, update session
        if (aiResponse.dataExtracted && Object.keys(aiResponse.dataExtracted).length > 0) {
            const lead = aiResponse.dataExtracted;
            lead.phone = phone;
            lead.channel = 'whatsapp';
            lead.session_id = sessionId;
            await updateSession(sessionId, { lead });
        }

        console.log(`[WhatsApp Out] To: ${phone} | Stage: ${aiResponse.sessionStage} | Properties: ${propertiesFound.length}`);

    } catch (err) {
        console.error('[WhatsApp Webhook Error]', err.message);
        // Try to send error message (best effort)
        try {
            const phone = (req.body.From || '').replace('whatsapp:', '');
            if (phone) {
                await sendWhatsApp(phone, "Sorry, I'm having a technical issue right now 😔\n\nPlease try again in a moment or contact us at admin@propabridge.com");
            }
        } catch { }
    }
});

/**
 * @swagger
 * /api/webhooks/whatsapp/status:
 *   post:
 *     tags: [📱 WhatsApp]
 *     summary: Twilio message status callback
 *     description: Receives delivery status updates for sent WhatsApp messages
 *     responses:
 *       200:
 *         description: Status logged
 */
router.post('/whatsapp/status', (req, res) => {
    const { MessageSid, MessageStatus, To, ErrorCode } = req.body;
    if (ErrorCode) {
        console.error(`[WhatsApp Status] ${MessageStatus} | SID: ${MessageSid} | To: ${To} | Error: ${ErrorCode}`);
    } else {
        console.log(`[WhatsApp Status] ${MessageStatus} | SID: ${MessageSid} | To: ${To}`);
    }
    res.status(200).send('OK');
});

// ─── Format reply for WhatsApp ────────────────────────────────────────────────
function formatWhatsAppReply(text) {
    // WhatsApp markdown: *bold*, _italic_, ~strikethrough~, ```code```
    // Clean up any HTML-like tags and keep it clean
    return text
        .replace(/<[^>]+>/g, '') // remove HTML
        .replace(/\*\*(.*?)\*\*/g, '*$1*') // **bold** → *bold*
        .replace(/__(.*?)__/g, '_$1_')     // __italic__ → _italic_
        .substring(0, 1600); // WhatsApp limit
}

// ─── Format property card for WhatsApp ───────────────────────────────────────
function formatPropertyCard(p, num) {
    const type = p.type === 'buy' ? 'FOR SALE' : 'FOR RENT';
    return `*${num}. ${p.title}*

💰 *${p.price_label}* ${p.type === 'buy' ? '' : '/year'}
📍 ${p.neighborhood}, Abuja
🛏 ${p.bedrooms} bedrooms | 🚿 ${p.bathrooms} bathrooms
${p.features ? '✨ ' + p.features.slice(0, 4).join(' · ') : ''}
✅ *Verified by Propabridge*

_Reply *${num}* for full details or to book a viewing_`;
}

module.exports = router;
