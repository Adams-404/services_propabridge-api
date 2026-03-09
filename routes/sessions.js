const router = require('express').Router();
const { getSession, getDB } = require('../services/firestore');

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     tags: [🤖 Agent]
 *     summary: Get all active sessions (admin view)
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const snap = await db.collection('sessions').orderBy('last_active', 'desc').limit(100).get();
    const sessions = snap.docs.map(d => {
      const data = d.data();
      return {
        session_id: data.session_id,
        stage: data.stage,
        message_count: data.message_count,
        lead: data.lead ? { name: data.lead.name, phone: data.lead.phone, score: data.lead.score } : null,
        created_at: data.created_at,
        last_active: data.last_active,
      };
    });
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    // Fallback: return empty if Firestore not configured
    res.json({ success: true, count: 0, data: [], note: 'Firestore not configured — connect serviceAccountKey.json' });
  }
});

/**
 * @swagger
 * /api/sessions/{session_id}:
 *   get:
 *     tags: [🤖 Agent]
 *     summary: Get full session with conversation history
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session data
 */
router.get('/:session_id', async (req, res) => {
  try {
    const session = await getSession(req.params.session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
