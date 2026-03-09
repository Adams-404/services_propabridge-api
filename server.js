/**
 * PROPABRIDGE — Multi-AI Agent Backend
 * Express Server with Swagger UI
 * =====================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
const path = require('path');
app.use(express.static(path.join(__dirname, 'public'))); // serve chat UI
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Swagger Config ───────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🏠 Propabridge AI Agent API',
      version: '1.0.0',
      description: `
## Propabridge Multi-AI Agent Backend

This API powers the Propabridge intelligent agent system — Nigeria's most advanced property AI.

### Agent Architecture
- **Concierge Agent** — Main conversational AI (Gemini 1.5 Pro), handles all user intents
- **Lead Capture Agent** — Naturally extracts contact details during conversation  
- **Property Search Agent** — Semantic property matching from natural language
- **Scheduling Agent** — Books viewings via Google Calendar
- **Follow-up Agent** — WhatsApp + SMS outreach pipeline

### Session Flow
\`\`\`
User opens chat → session_id assigned → Concierge Agent engages
→ Contact details captured naturally → Lead stored → WhatsApp welcome sent
→ Viewing interest? → Calendar event created → SMS + WhatsApp confirmations
→ Automated follow-ups at 24hr, 1hr before viewing
\`\`\`

### Base URL
- **Dev:** \`http://localhost:8080\`
- **Prod:** \`https://api.propabridge.com\`
      `,
      contact: {
        name: 'Zippatek Digital Ltd',
        email: 'admin@propabridge.com',
        url: 'https://propabridge.com',
      },
    },
    servers: [
      { url: 'http://localhost:8080', description: 'Development Server' },
      { url: 'https://api.propabridge.com', description: 'Production Server' },
    ],
    tags: [
      { name: '🤖 Agent', description: 'AI Chat & Session Management' },
      { name: '🏠 Properties', description: 'Property Listings CRUD' },
      { name: '👥 Leads', description: 'Lead Capture & Management' },
      { name: '📅 Scheduler', description: 'Viewing Appointments & Calendar' },
      { name: '💬 Notifications', description: 'WhatsApp & SMS Outreach' },
      { name: '🗄️ Database', description: 'Seed & Manage Sample Data' },
    ],
    components: {
      schemas: {
        Session: {
          type: 'object',
          properties: {
            session_id: { type: 'string', example: 'sess_a1b2c3d4e5f6' },
            created_at: { type: 'string', format: 'date-time' },
            last_active: { type: 'string', format: 'date-time' },
            lead: { $ref: '#/components/schemas/LeadProfile' },
            message_count: { type: 'integer', example: 7 },
          },
        },
        LeadProfile: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Aminu Yusuf' },
            phone: { type: 'string', example: '+2348012345678' },
            email: { type: 'string', example: 'aminu@email.com' },
            budget: { type: 'string', example: '2.5M/year' },
            location_preference: { type: 'string', example: 'Gwarinpa, Abuja' },
            bedrooms: { type: 'integer', example: 3 },
            intent: { type: 'string', enum: ['buy', 'rent', 'invest', 'unknown'] },
            score: { type: 'integer', example: 82, description: '0-100 lead quality score' },
            captured_at: { type: 'string', format: 'date-time' },
          },
        },
        ChatMessage: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', example: 'I am looking for a 3 bedroom flat in Gwarinpa' },
            session_id: { type: 'string', example: 'sess_a1b2c3d4e5f6', description: 'Omit for new session' },
          },
        },
        ChatResponse: {
          type: 'object',
          properties: {
            session_id: { type: 'string' },
            reply: { type: 'string', example: "I found 4 verified properties in Gwarinpa matching your budget! 🏠" },
            properties_found: { type: 'array', items: { $ref: '#/components/schemas/PropertyCard' } },
            lead_captured: { type: 'boolean' },
            whatsapp_sent: { type: 'boolean' },
            action_taken: { type: 'string', enum: ['none', 'lead_captured', 'viewing_booked', 'properties_shown', 'followup_scheduled'] },
            session: { $ref: '#/components/schemas/Session' },
          },
        },
        Property: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', example: '3-Bedroom Apartment in Maitama' },
            price: { type: 'number', example: 3500000 },
            price_label: { type: 'string', example: '₦3.5M/year' },
            type: { type: 'string', enum: ['rent', 'buy'] },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            size_sqm: { type: 'integer' },
            neighborhood: { type: 'string', example: 'Maitama' },
            city: { type: 'string', example: 'Abuja' },
            address: { type: 'string' },
            description: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            features: { type: 'array', items: { type: 'string' } },
            verified: { type: 'boolean' },
            agent_name: { type: 'string' },
            agent_phone: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        PropertyCard: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            price_label: { type: 'string' },
            bedrooms: { type: 'integer' },
            neighborhood: { type: 'string' },
            image: { type: 'string' },
            verified: { type: 'boolean' },
          },
        },
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            session_id: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            budget: { type: 'string' },
            intent: { type: 'string' },
            score: { type: 'integer' },
            status: { type: 'string', enum: ['new', 'contacted', 'viewing_scheduled', 'converted', 'dead'] },
            property_interest: { type: 'array', items: { type: 'string' } },
            conversation_summary: { type: 'string' },
            whatsapp_sent: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            lead_id: { type: 'string' },
            property_id: { type: 'string' },
            lead_name: { type: 'string' },
            lead_phone: { type: 'string' },
            property_title: { type: 'string' },
            date: { type: 'string', example: '2025-03-10' },
            time: { type: 'string', example: '10:00 AM' },
            calendar_event_id: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
            reminders_sent: { type: 'object' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { background: #001A40; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::after {
      content: '🏠 Propabridge AI Agent API';
      color: white; font-size: 20px; font-weight: 700;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .swagger-ui .info h2 { color: #001A40; }
    .swagger-ui .btn.execute { background: #006AFF; border-color: #006AFF; }
  `,
  customSiteTitle: 'Propabridge API Docs',
}));

// Serve raw swagger JSON (useful for Postman import)
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/agent', require('./routes/agent'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/scheduler', require('./routes/scheduler'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/calendar',      require('./routes/calendar'));
app.use('/api/webhooks',      require('./routes/webhooks'));
app.use('/api/db', require('./routes/database'));

// ─── Health Check (for Docker + Cloud Run) ───────────────────────────────────
app.get('/health', (req, res) => {
  const { getStorageMode } = require('./services/firestore');
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    storage: getStorageMode(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const { getStorageMode } = require('./services/firestore');
  res.json({
    name: '🏠 Propabridge Multi-AI Agent API',
    version: '1.0.0',
    status: 'running',
    storage: getStorageMode(),
    docs: '/docs',
    endpoints: {
      chat: 'POST /api/agent/chat',
      sessions: 'GET  /api/sessions',
      properties: 'GET  /api/properties',
      leads: 'GET  /api/leads',
      scheduler: 'POST /api/scheduler/book',
      notifications: 'POST /api/notifications/whatsapp',
      seed_db: 'POST /api/db/seed',
    },
  });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', docs: '/docs' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  const { getStorageMode } = require('./services/firestore');
  console.log(`\n🏠 Propabridge API running on port ${PORT}`);
  console.log(`📖 Swagger UI: http://localhost:${PORT}/docs`);
  console.log(`🔌 API Base:   http://localhost:${PORT}/api`);
  console.log(`💾 Storage:    ${getStorageMode()}`);
  console.log(`🤖 AI Model:   ${process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview'}\n`);
});

module.exports = app;
