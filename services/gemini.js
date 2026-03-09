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
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

function getModel(temp = 0.7) {
  return genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { maxOutputTokens: 1024, temperature: temp },
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
  const chatHistory = history.slice(-10).map(h => ({
    role: h.role === 'model' ? 'model' : 'user',
    parts: [{ text: h.text }],
  }));

  const chatSession = model.startChat({
    history: chatHistory,
    systemInstruction: { parts: [{ text: systemPrompt }] },
  });

  const result = await Promise.race([
    chatSession.sendMessage(message),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI response timeout')), 15000)
    )
  ]);
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

// ─── Streaming Chat — Real-time word-by-word responses ───────────────────────
async function* chatStream({ message, history = [], sessionId, sessionData = {} }) {
  const model = getModel(0.75);

  const systemPrompt = MAIN_SYSTEM_PROMPT
    .replace('{{CURRENT_DATE}}', new Date().toLocaleDateString('en-NG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }))
    .replace('{{SESSION_ID}}', sessionId);

  const chatHistory = history.slice(-10).map(h => ({
    role: h.role === 'model' ? 'model' : 'user',
    parts: [{ text: h.text }],
  }));

  const chatSession = model.startChat({
    history: chatHistory,
    systemInstruction: { parts: [{ text: systemPrompt }] },
  });

  const result = await Promise.race([
    chatSession.sendMessageStream(message),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI response timeout')), 15000)
    )
  ]);

  let accumulatedText = '';

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    accumulatedText += chunkText;

    // Send the chunk as it comes
    yield {
      type: 'chunk',
      text: chunkText,
      accumulated: accumulatedText
    };
  }

  // Try to parse the final accumulated response
  const parsed = parseJSON(accumulatedText);

  // Send final structured data
  yield {
    type: 'complete',
    reply: parsed?.reply || accumulatedText,
    actions: parsed?.actions || [],
    dataExtracted: parsed?.data_extracted || {},
    propertiesToShow: parsed?.properties_to_show || [],
    sessionStage: parsed?.session_stage || 'discovery',
    raw: accumulatedText,
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

module.exports = { chat, chatStream, extractLeadData, parseSearchQuery, summarizeConversation, generateFollowUp };
