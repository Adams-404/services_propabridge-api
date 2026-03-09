# 🏠 Propabridge — Multi-AI Agent Backend

**The conversational AI engine of Propabridge.** Built with Node.js, Google Gemini 1.5 Pro, Firestore, Twilio, and Google Calendar.

---

## Quick Start (5 Steps)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Then open .env and fill in your values
```

### 3. Add your Firebase service account
- Go to: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- Download the JSON file
- Rename it to `serviceAccountKey.json`
- Place it in the project root (same folder as `server.js`)

### 4. Run the server
```bash
npm run dev          # Development (auto-restarts on save)
npm start            # Production
```

### 5. Open Swagger UI
```
http://localhost:8080/docs
```

---

## Testing the Agent (Swagger UI Flow)

### Step 1 — Start a conversation (no session_id needed)
`POST /api/agent/chat`
```json
{
  "message": "I'm looking for a 3 bedroom flat to rent in Gwarinpa, my budget is 2.5 million per year"
}
```
→ Copy the `session_id` from the response

### Step 2 — Continue the conversation
```json
{
  "session_id": "sess_xxxxx",
  "message": "I like the first one, can I book a viewing?"
}
```

### Step 3 — Share contact info (triggers lead capture + WhatsApp)
```json
{
  "session_id": "sess_xxxxx",
  "message": "My name is Aminu, my WhatsApp is 08012345678"
}
```
→ Lead saved to Firestore + WhatsApp sent automatically

### Step 4 — View the session
`GET /api/agent/session/{session_id}`

### Step 5 — View leads
`GET /api/leads`

---

## Architecture

```
User Message
     ↓
POST /api/agent/chat
     ↓
Session Manager ──→ Firestore (create/load session + history)
     ↓
Gemini 1.5 Pro ──→ System Prompt (propabridge.js)
     ↓
Action Dispatcher:
  ├── SEARCH_PROPERTIES → Firestore/sample DB
  ├── CAPTURE_LEAD → Firestore + Twilio WhatsApp
  ├── BOOK_VIEWING → Google Calendar + Twilio WhatsApp
  └── SEND_FOLLOWUP → Twilio
     ↓
Response (reply + properties + lead status + session)
```

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `GOOGLE_CLOUD_PROJECT` | Your GCP project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON |
| `VERTEX_AI_LOCATION` | Usually `us-central1` |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `TWILIO_ACCOUNT_SID` | From Twilio console |
| `TWILIO_AUTH_TOKEN` | From Twilio console |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+14155238886` (sandbox) |
| `TWILIO_SMS_NUMBER` | Your Twilio phone number |
| `GOOGLE_CALENDAR_ID` | Your Google Calendar ID |
| `ADMIN_PHONE` | Admin WhatsApp for hot lead alerts |

---

## Seeding the Database

```bash
npm run seed
# or via API:
# POST http://localhost:8080/api/db/seed
```

This creates 15 realistic Abuja property listings with:
- Real neighborhood names and coordinates
- Unsplash property images
- Naira pricing
- Nigerian agent names and phone numbers
- Feature lists (BQ, Generator, Borehole, etc.)

---

## Connecting to Framer

You have two environments for the Chatbot widget:

**1. Live Production**
Point your API base to the live Cloud Run URL:
```javascript
const API_BASE = 'https://propabridge-api-480235407496.us-central1.run.app';
```

**2. Local Development (The Offline Framer Test Environment)**
If you are developing locally and modifying the component code before pasting it into Framer, you can test it locally without touching the `public/` folder.

1. Ensure your backend is running (`npm start` in the main folder) on `http://localhost:8080`.
2. Open a new terminal tab and navigate into the framer folder:
   ```bash
   cd framer
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
4. Temporarily change the `API_URL` variable inside `framer/PropabridgeChatbot.tsx` to `http://localhost:8080`.
5. When you are done testing, change the `API_URL` back to the live production URL, copy the entire file content, and paste it into Framer!

```javascript
// Example streaming connection code used in the component
const response = await fetch(`${API_BASE}/api/agent/chat/stream`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userInput, session_id: sessionId })
});
// (See framer/PropabridgeChatbot.tsx for the full stream decoding logic)
```

---

## Deployment (Google Cloud Run)

```bash
gcloud run deploy propabridge-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --memory 1Gi
```
