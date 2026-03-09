/**
 * PROPABRIDGE — Gemini AI Service
 * Handles all Google Generative AI (Gemini) interactions
 * Uses @google/generative-ai SDK with Gemini 3.0 Flash
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  MAIN_SYSTEM_PROMPT,
  LEAD_EXTRACTION_PROMPT,
  SEARCH_PARSE_PROMPT,
  SUMMARY_PROMPT,
  FOLLOWUP_PROMPT,
} = require('../prompts/propabridge');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set — AI features will not work. Get one at https://aistudio.google.com/apikey');
}

const genAI = new GoogleGenerativeAI(API_KEY || 'MISSING_KEY');
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';

function getModel(temp = 0.7) {
  return genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { maxOutputTokens: 2048, temperature: temp },
  });
}

// ─── Parse JSON safely from Gemini output ────────────────────────────────────
function parseJSON(text) {
  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    // Try extracting JSON from somewhere in the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return null;
  }
}

// ─── Main Chat — Propa conversational agent ───────────────────────────────────
async function chat({ message, history = [], sessionId, sessionData = {} }) {
  const model = getModel(0.75);

  const systemPrompt = MAIN_SYSTEM_PROMPT
    .replace('{{CURRENT_DATE}}', new Date().toLocaleDateString('en-NG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }))
    .replace('{{SESSION_ID}}', sessionId);

  // Build conversation history for the Gemini chat API
  const chatHistory = history.slice(-20).map(h => ({
    role: h.role === 'model' ? 'model' : 'user',
    parts: [{ text: h.text }],
  }));

  const chatSession = model.startChat({
    history: chatHistory,
    systemInstruction: { parts: [{ text: systemPrompt }] },
  });

  const result = await chatSession.sendMessage(message);
  const rawReply = result.response.text();

  // Try to parse structured JSON response
  const parsed = parseJSON(rawReply);

  if (parsed && parsed.reply) {
    return {
      reply: parsed.reply,
      actions: parsed.actions || [],
      dataExtracted: parsed.data_extracted || {},
      propertiesToShow: parsed.properties_to_show || [],
      sessionStage: parsed.session_stage || 'discovery',
      raw: rawReply,
    };
  }

  // Fallback: treat as plain text response
  return {
    reply: rawReply,
    actions: [],
    dataExtracted: {},
    propertiesToShow: [],
    sessionStage: 'discovery',
    raw: rawReply,
  };
}

// ─── Extract lead data from conversation ─────────────────────────────────────
async function extractLeadData(conversation) {
  const model = getModel(0.1); // low temp for accurate extraction

  const conversationText = conversation
    .map(m => `${m.role === 'user' ? 'User' : 'Propa'}: ${m.text}`)
    .join('\n');

  const prompt = LEAD_EXTRACTION_PROMPT.replace('{{CONVERSATION}}', conversationText);

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  return parseJSON(rawText) || {};
}

// ─── Parse search query to filters ───────────────────────────────────────────
async function parseSearchQuery(query, context = '') {
  const model = getModel(0.1);

  const prompt = SEARCH_PARSE_PROMPT
    .replace('{{QUERY}}', query)
    .replace('{{CONTEXT}}', context);

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  return parseJSON(rawText) || {};
}

// ─── Summarize conversation for CRM ──────────────────────────────────────────
async function summarizeConversation(conversation) {
  const model = getModel(0.3);

  const conversationText = conversation
    .map(m => `${m.role === 'user' ? 'User' : 'Propa'}: ${m.text}`)
    .join('\n');

  const prompt = SUMMARY_PROMPT.replace('{{CONVERSATION}}', conversationText);

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ─── Generate personalized follow-up message ─────────────────────────────────
async function generateFollowUp({ name, intent, location, budget, propertiesShown, daysAgo, followupType }) {
  const model = getModel(0.8);

  const prompt = FOLLOWUP_PROMPT
    .replace('{{NAME}}', name || 'there')
    .replace('{{INTENT}}', intent || 'rent')
    .replace('{{LOCATION}}', location || 'Abuja')
    .replace('{{BUDGET}}', budget || 'not specified')
    .replace('{{PROPERTIES_SHOWN}}', propertiesShown || 'none yet')
    .replace('{{DAYS_AGO}}', daysAgo || '1')
    .replace('{{FOLLOWUP_TYPE}}', followupType || '24h_after_inquiry');

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = { chat, extractLeadData, parseSearchQuery, summarizeConversation, generateFollowUp };
