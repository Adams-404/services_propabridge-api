/**
 * Notifications Route
 */
const router = require('express').Router();
const { sendWhatsApp, sendSMS, templates } = require('../services/twilio');
const { generateFollowUp } = require('../services/gemini');

/**
 * @swagger
 * /api/notifications/whatsapp:
 *   post:
 *     tags: [💬 Notifications]
 *     summary: Send a WhatsApp message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, message]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *               message:
 *                 type: string
 *                 example: "Hi Aminu! We have a new property matching your search in Gwarinpa 🏠"
 *     responses:
 *       200:
 *         description: Message sent
 */
router.post('/whatsapp', async (req, res) => {
  try {
    const result = await sendWhatsApp(req.body.phone, req.body.message);
    res.json({ success: true, message_sid: result.sid, to: req.body.phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/notifications/sms:
 *   post:
 *     tags: [💬 Notifications]
 *     summary: Send an SMS message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, message]
 *             properties:
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: SMS sent
 */
router.post('/sms', async (req, res) => {
  try {
    const result = await sendSMS(req.body.phone, req.body.message);
    res.json({ success: true, message_sid: result.sid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/notifications/ai-followup:
 *   post:
 *     tags: [💬 Notifications]
 *     summary: Generate AI-personalized follow-up and optionally send via WhatsApp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [followup_type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Aminu Yusuf
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *               intent:
 *                 type: string
 *                 enum: [rent, buy, invest]
 *               location:
 *                 type: string
 *                 example: Gwarinpa
 *               budget:
 *                 type: string
 *                 example: "2.5M per year"
 *               followup_type:
 *                 type: string
 *                 enum: [24h_after_inquiry, new_matching_property, viewing_reminder_24h, post_viewing, weekly_nurture]
 *               send_now:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Follow-up message (preview or sent)
 */
router.post('/ai-followup', async (req, res) => {
  try {
    const { name, phone, intent, location, budget, followup_type, send_now = false } = req.body;

    const message = await generateFollowUp({
      name, intent, location, budget,
      followupType: followup_type,
      daysAgo: req.body.days_ago || 1,
      propertiesShown: req.body.properties_shown || 'none',
    });

    let sent = false;
    if (send_now && phone) {
      await sendWhatsApp(phone, message);
      sent = true;
    }

    res.json({ success: true, message, sent, followup_type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
