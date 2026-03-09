/**
 * PROPABRIDGE — Main AI Agent Route
 * Full multi-agent chat with session, lead capture, and action dispatch
 */

const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const gemini = require('../services/gemini');
const { sendWhatsApp, templates } = require('../services/twilio');
const { createViewingEvent } = require('../services/calendar');
const {
  createSession, getSession, updateSession, addMessageToSession,
  saveLead, updateLead, getProperties, saveAppointment,
} = require('../services/firestore');
const { SAMPLE_PROPERTIES } = require('../data/seed');

// ─── Fallback DB (uses sample data if Firestore is not available) ──────────────
async function searchProperties(filters) {
  try {
    return await getProperties(filters);
  } catch {
    // Fallback to in-memory sample data
    let results = SAMPLE_PROPERTIES.filter(p => {
      if (filters.type && p.type !== filters.type) return false;
      if (filters.bedrooms && p.bedrooms !== parseInt(filters.bedrooms)) return false;
      if (filters.neighborhood && !p.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())) return false;
      if (filters.maxPrice && p.price > filters.maxPrice) return false;
      return true;
    });
    return results.slice(0, filters.limit || 6);
  }
}

// ─── Action Dispatcher ────────────────────────────────────────────────────────
async function dispatchActions({ actions, dataExtracted, session, sessionId, propertiesToShow }) {
  const results = {};
  let propertiesFound = [];

  for (const action of actions) {
    try {
      switch (action) {

        // ── Search properties based on extracted data ──
        case 'SEARCH_PROPERTIES': {
          const filters = {
            type: dataExtracted.intent === 'buy' ? 'buy' : 'rent',
            bedrooms: dataExtracted.bedrooms,
            neighborhood: dataExtracted.location_preference,
            maxPrice: dataExtracted.budget ? parseBudget(dataExtracted.budget) : null,
            limit: 6,
          };
          propertiesFound = await searchProperties(filters);
          results.propertiesFound = propertiesFound;
          await updateSession(sessionId, {
            properties_shown: [...(session.properties_shown || []), ...propertiesFound.map(p => p.id)]
          });
          break;
        }

        // ── Save lead to DB and send WhatsApp welcome ──
        case 'CAPTURE_LEAD': {
          if (!dataExtracted.phone && !dataExtracted.email) break;

          const existingLead = session.lead;
          const leadData = {
            id: existingLead?.id || `lead_${uuidv4().slice(0, 8)}`,
            session_id: sessionId,
            name: dataExtracted.name || existingLead?.name || null,
            phone: dataExtracted.phone || existingLead?.phone || null,
            email: dataExtracted.email || existingLead?.email || null,
            budget: dataExtracted.budget || existingLead?.budget || null,
            intent: dataExtracted.intent || existingLead?.intent || 'unknown',
            location_preference: dataExtracted.location_preference || existingLead?.location_preference || null,
            bedrooms: dataExtracted.bedrooms || existingLead?.bedrooms || null,
            urgency: dataExtracted.urgency || 'warm',
            status: 'new',
            score: calculateLeadScore(dataExtracted),
            property_interest: session.properties_shown || [],
            whatsapp_sent: false,
            captured_at: new Date().toISOString(),
          };

          await saveLead(leadData);
          await updateSession(sessionId, { lead: leadData, stage: 'captured' });
          results.leadCaptured = true;
          results.leadId = leadData.id;

          // Send WhatsApp welcome if phone available
          if (leadData.phone) {
            try {
              await sendWhatsApp(
                leadData.phone,
                templates.leadWelcome(leadData.name, leadData.location_preference, leadData.budget)
              );
              await updateLead(leadData.id, { whatsapp_sent: true, whatsapp_sent_at: new Date().toISOString() });
              results.whatsappSent = true;

              // Alert admin if hot lead
              if (leadData.score >= 70 && process.env.ADMIN_PHONE) {
                await sendWhatsApp(process.env.ADMIN_PHONE, templates.hotLeadAlert(leadData));
              }
            } catch (e) {
              console.error('WhatsApp send error (non-critical):', e.message);
              results.whatsappError = e.message;
            }
          }
          break;
        }

        // ── Book a viewing appointment ──
        case 'BOOK_VIEWING': {
          if (!dataExtracted.phone) break;
          const lead = session.lead;
          const propertyId = propertiesToShow?.[0] || session.properties_shown?.[0];
          if (!propertyId) break;

          const property = SAMPLE_PROPERTIES.find(p => p.id === propertyId) ||
            await getProperties({ id: propertyId }).then(r => r[0]).catch(() => null);
          if (!property) break;

          // Create calendar event
          let calendarEvent = null;
          try {
            calendarEvent = await createViewingEvent({
              lead: { ...lead, ...dataExtracted },
              property,
              date: dataExtracted.viewing_date_preference || getTomorrowDate(),
              time: '10:00 AM',
            });
          } catch (e) {
            console.error('Calendar error (non-critical):', e.message);
          }

          // Save appointment
          const appt = await saveAppointment({
            lead_id: lead?.id,
            lead_name: dataExtracted.name || lead?.name || 'Unknown',
            lead_phone: dataExtracted.phone || lead?.phone,
            property_id: propertyId,
            property_title: property.title,
            property_address: property.address,
            date: dataExtracted.viewing_date_preference || getTomorrowDate(),
            time: '10:00 AM',
            calendar_event_id: calendarEvent?.event_id || null,
            calendar_link: calendarEvent?.event_link || null,
            agent_name: property.agent_name,
            agent_phone: property.agent_phone,
          });

          results.appointmentBooked = true;
          results.appointmentId = appt.id;

          // Send WhatsApp confirmation
          const phone = dataExtracted.phone || lead?.phone;
          if (phone) {
            try {
              await sendWhatsApp(
                phone,
                templates.viewingConfirmation(
                  dataExtracted.name || lead?.name || 'there',
                  property,
                  appt.date,
                  appt.time,
                  property.agent_name
                )
              );
              results.confirmationSent = true;
            } catch (e) {
              console.error('Confirmation WhatsApp error:', e.message);
            }
          }

          await updateSession(sessionId, { stage: 'viewing_booked', appointment_id: appt.id });
          break;
        }

      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err.message);
      results[`${action}_error`] = err.message;
    }
  }

  return { results, propertiesFound };
}

// ─── Determine actions from agent response ────────────────────────────────────
async function inferActions(agentResponse, session, dataExtracted) {
  const actions = [...(agentResponse.actions || [])];

  // Auto-detect SEARCH if location or bedrooms mentioned and not already searched
  if ((dataExtracted.location_preference || dataExtracted.bedrooms || dataExtracted.budget) &&
    !actions.includes('SEARCH_PROPERTIES')) {
    actions.push('SEARCH_PROPERTIES');
  }

  // Auto-detect CAPTURE_LEAD if contact info extracted
  if ((dataExtracted.phone || dataExtracted.email) && !session.lead?.phone) {
    if (!actions.includes('CAPTURE_LEAD')) actions.push('CAPTURE_LEAD');
  }

  // Auto-detect BOOK_VIEWING if user expressed intent to view
  if (dataExtracted.viewing_requested && dataExtracted.phone && session.properties_shown?.length > 0) {
    if (!actions.includes('BOOK_VIEWING')) actions.push('BOOK_VIEWING');
  }

  return actions;
}

// ─── Helper: Calculate lead score ─────────────────────────────────────────────
function calculateLeadScore(data) {
  let score = 0;
  if (data.phone) score += 30;
  if (data.email) score += 10;
  if (data.name) score += 10;
  if (data.budget) score += 20;
  if (data.location_preference) score += 10;
  if (data.bedrooms) score += 5;
  if (data.intent && data.intent !== 'unknown') score += 5;
  if (data.urgency === 'hot') score += 10;
  if (data.viewing_requested) score += 15;
  return Math.min(score, 100);
}

function parseBudget(budgetStr) {
  if (!budgetStr) return null;
  const num = parseFloat(budgetStr.replace(/[₦,\s]/g, '').replace(/M$/i, '000000').replace(/K$/i, '000'));
  return isNaN(num) ? null : num;
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @swagger
 * /api/agent/chat:
 *   post:
 *     tags: [🤖 Agent]
 *     summary: Send a message to Propa (the AI agent)
 *     description: |
 *       The main chat endpoint. Handles the full AI agent flow:
 *       - Creates a new session if `session_id` is omitted
 *       - Sends message to Gemini with full conversation history
 *       - Extracts lead data naturally from the conversation
 *       - Searches properties if intent is detected
 *       - Captures lead and sends WhatsApp if contact info shared
 *       - Books viewings via Google Calendar if requested
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessage'
 *           examples:
 *             newSession:
 *               summary: Start a new conversation
 *               value:
 *                 message: "I am looking for a 3 bedroom flat to rent in Gwarinpa, Abuja. Budget around 2.5 million per year."
 *             continueSession:
 *               summary: Continue existing conversation
 *               value:
 *                 message: "Can I book a viewing for the first property?"
 *                 session_id: "sess_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Agent response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // ── 1. Get or create session ──
    const sessionId = session_id || `sess_${uuidv4().slice(0, 12)}`;
    let session = await getSession(sessionId).catch(() => null);
    if (!session) {
      session = await createSession(sessionId).catch(() => ({
        session_id: sessionId, history: [], lead: null, stage: 'greeting',
        message_count: 0, properties_shown: [],
      }));
    }

    // ── 2. Save user message ──
    await addMessageToSession(sessionId, 'user', message).catch(() => {
      session.history = [...(session.history || []), { role: 'user', text: message }];
    });

    // ── 3. Call Gemini agent ──
    const agentResponse = await gemini.chat({
      message,
      history: session.history || [],
      sessionId,
      sessionData: session,
    });

    // ── 4. Extract structured lead data from full conversation ──
    const fullHistory = [...(session.history || []),
    { role: 'user', text: message },
    { role: 'model', text: agentResponse.reply }];

    const dataExtracted = await gemini.extractLeadData(fullHistory).catch(() => agentResponse.dataExtracted || {});

    // ── 5. Determine and run actions ──
    const actions = await inferActions(agentResponse, session, dataExtracted);
    const { results: actionResults, propertiesFound } = await dispatchActions({
      actions,
      dataExtracted,
      session,
      sessionId,
      propertiesToShow: agentResponse.propertiesToShow,
    });

    // ── 6. Save assistant reply ──
    await addMessageToSession(sessionId, 'model', agentResponse.reply).catch(() => { });

    // ── 7. Update session stage ──
    await updateSession(sessionId, {
      stage: agentResponse.sessionStage || session.stage,
    }).catch(() => { });

    // ── 8. Get updated session ──
    const updatedSession = await getSession(sessionId).catch(() => session);

    // ── 9. Respond ──
    res.json({
      session_id: sessionId,
      reply: agentResponse.reply,
      properties_found: propertiesFound.slice(0, 4).map(p => ({
        id: p.id,
        title: p.title,
        price_label: p.price_label,
        bedrooms: p.bedrooms,
        neighborhood: p.neighborhood,
        image: p.images?.[0] || null,
        verified: p.verified,
        type: p.type,
        features: p.features?.slice(0, 4),
      })),
      lead_captured: !!actionResults.leadCaptured,
      whatsapp_sent: !!actionResults.whatsappSent,
      viewing_booked: !!actionResults.appointmentBooked,
      appointment_id: actionResults.appointmentId || null,
      action_taken: actionResults.appointmentBooked ? 'viewing_booked'
        : actionResults.leadCaptured ? 'lead_captured'
          : propertiesFound.length > 0 ? 'properties_shown'
            : 'none',
      session: {
        session_id: sessionId,
        message_count: updatedSession?.message_count || 0,
        stage: updatedSession?.stage || agentResponse.sessionStage,
        lead: updatedSession?.lead || null,
        created_at: updatedSession?.created_at,
        last_active: updatedSession?.last_active,
      },
    });

  } catch (err) {
    console.error('[Agent Chat Error]', err);
    res.status(500).json({
      error: 'Agent temporarily unavailable',
      fallback: 'Please contact us at hello@propabridge.com or +234 805 641 9040',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

/**
 * @swagger
 * /api/agent/chat/stream:
 *   post:
 *     tags: [🤖 Agent]
 *     summary: Stream real-time responses from Propa (word-by-word)
 *     description: |
 *       Streaming chat endpoint that returns responses in real-time as they're generated.
 *       Uses Server-Sent Events (SSE) for instant word-by-word delivery.
 *       Much faster perceived response time for users.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessage'
 *     responses:
 *       200:
 *         description: Streaming response (Server-Sent Events)
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // ── 1. Get or create session ──
    const sessionId = session_id || `sess_${uuidv4().slice(0, 12)}`;
    let session = await getSession(sessionId).catch(() => null);
    if (!session) {
      session = await createSession(sessionId).catch(() => ({
        session_id: sessionId, history: [], lead: null, stage: 'greeting',
        message_count: 0, properties_shown: [],
      }));
    }

    // ── 2. Save user message ──
    await addMessageToSession(sessionId, 'user', message).catch(() => {
      session.history = [...(session.history || []), { role: 'user', text: message }];
    });

    // Send session ID first
    res.write(`data: ${JSON.stringify({ type: 'session_id', session_id: sessionId })}\n\n`);

    // ── 3. Stream Gemini response ──
    let finalResponse = null;
    let accumulatedText = '';

    try {
      for await (const chunk of gemini.chatStream({
        message,
        history: session.history || [],
        sessionId,
        sessionData: session,
      })) {
        if (chunk.type === 'chunk') {
          accumulatedText += chunk.text;
          res.write(`data: ${JSON.stringify({ 
            type: 'chunk', 
            text: chunk.text,
            accumulated: accumulatedText 
          })}\n\n`);
        } else if (chunk.type === 'complete') {
          finalResponse = chunk;
          res.write(`data: ${JSON.stringify({ 
            type: 'complete',
            reply: chunk.reply,
            actions: chunk.actions,
            dataExtracted: chunk.dataExtracted,
            propertiesToShow: chunk.propertiesToShow,
            sessionStage: chunk.sessionStage
          })}\n\n`);
          break;
        }
      }
    } catch (err) {
      console.error('[Stream Error]', err);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: 'AI response failed' 
      })}\n\n`);
    }

    // ── 4. Process actions if we have a complete response ──
    if (finalResponse) {
      try {
        const fullHistory = [...(session.history || []),
        { role: 'user', text: message },
        { role: 'model', text: finalResponse.reply }];

        const dataExtracted = finalResponse.dataExtracted || {};
        const actions = await inferActions(finalResponse, session, dataExtracted);
        const { results: actionResults, propertiesFound } = await dispatchActions({
          actions,
          dataExtracted,
          session,
          sessionId,
          propertiesToShow: finalResponse.propertiesToShow,
        });

        // Save the complete response
        await addMessageToSession(sessionId, 'model', finalResponse.reply).catch(() => { });
        await updateSession(sessionId, {
          stage: finalResponse.sessionStage || session.stage,
        }).catch(() => { });

        // Send final results
        res.write(`data: ${JSON.stringify({ 
          type: 'final',
          properties_found: propertiesFound.slice(0, 4).map(p => ({
            id: p.id,
            title: p.title,
            price_label: p.price_label,
            bedrooms: p.bedrooms,
            neighborhood: p.neighborhood,
            image: p.images?.[0] || null,
            verified: p.verified,
            type: p.type,
            features: p.features?.slice(0, 4),
          })),
          lead_captured: !!actionResults.leadCaptured,
          whatsapp_sent: !!actionResults.whatsappSent,
          viewing_booked: !!actionResults.appointmentBooked,
          appointment_id: actionResults.appointmentId || null,
          action_taken: actionResults.appointmentBooked ? 'viewing_booked'
            : actionResults.leadCaptured ? 'lead_captured'
              : propertiesFound.length > 0 ? 'properties_shown'
                : 'none',
        })}\n\n`);
      } catch (err) {
        console.error('[Action Processing Error]', err);
        res.write(`data: ${JSON.stringify({ 
          type: 'action_error', 
          error: 'Action processing failed' 
        })}\n\n`);
      }
    }

    // Close the stream
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (err) {
    console.error('[Stream Setup Error]', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Stream setup failed',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
});

/**
 * @swagger
 * /api/agent/session/{session_id}:
 *   get:
 *     tags: [🤖 Agent]
 *     summary: Get full session data including conversation history
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full session data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 */
router.get('/session/:session_id', async (req, res) => {
  const session = await getSession(req.params.session_id).catch(() => null);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

/**
 * @swagger
 * /api/agent/summarize/{session_id}:
 *   post:
 *     tags: [🤖 Agent]
 *     summary: Generate AI summary of a session for CRM
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CRM-ready conversation summary
 */
router.post('/summarize/:session_id', async (req, res) => {
  try {
    const session = await getSession(req.params.session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const summary = await gemini.summarizeConversation(session.history || []);
    res.json({ summary, session_id: req.params.session_id, lead: session.lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/agent/followup:
 *   post:
 *     tags: [🤖 Agent]
 *     summary: Generate and send a personalized follow-up message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lead_id, followup_type]
 *             properties:
 *               lead_id:
 *                 type: string
 *                 example: "lead_abc123"
 *               followup_type:
 *                 type: string
 *                 enum: [24h_after_inquiry, new_matching_property, weekly_nurture, post_viewing]
 *               send_whatsapp:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Follow-up message generated (and optionally sent)
 */
router.post('/followup', async (req, res) => {
  try {
    const { lead_id, followup_type, send_whatsapp = false } = req.body;

    // Get lead data (from DB or fallback)
    // In production this comes from getLeads({id: lead_id})
    const lead = {
      name: req.body.name || 'there',
      phone: req.body.phone,
      intent: req.body.intent || 'rent',
      location_preference: req.body.location || 'Abuja',
      budget: req.body.budget,
    };

    const message = await gemini.generateFollowUp({
      name: lead.name,
      intent: lead.intent,
      location: lead.location_preference,
      budget: lead.budget,
      propertiesShown: req.body.properties_shown || 'none',
      daysAgo: req.body.days_ago || 1,
      followupType: followup_type,
    });

    let sent = false;
    if (send_whatsapp && lead.phone) {
      await sendWhatsApp(lead.phone, message);
      sent = true;
    }

    res.json({ message, sent, lead_id, followup_type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
