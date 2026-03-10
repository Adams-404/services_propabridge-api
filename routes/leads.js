const router = require('express').Router();
const { saveLead, getLeads, updateLead } = require('../services/db');
const { sendWhatsApp, templates } = require('../services/twilio');

/**
 * @swagger
 * /api/leads:
 *   get:
 *     tags: [👥 Leads]
 *     summary: Get all captured leads
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, contacted, viewing_scheduled, converted, dead]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of leads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 */
router.get('/', async (req, res) => {
  try {
    const data = await getLeads({ status: req.query.status, limit: parseInt(req.query.limit) || 50 });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/leads/{id}/status:
 *   patch:
 *     tags: [👥 Leads]
 *     summary: Update lead status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, contacted, viewing_scheduled, converted, dead]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead updated
 */
router.patch('/:id/status', async (req, res) => {
  try {
    await updateLead(req.params.id, { status: req.body.status, notes: req.body.notes });
    res.json({ success: true, id: req.params.id, status: req.body.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/leads/{id}/whatsapp:
 *   post:
 *     tags: [👥 Leads]
 *     summary: Manually send a WhatsApp message to a lead
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 example: "Hi Aminu, following up on your property inquiry..."
 *     responses:
 *       200:
 *         description: WhatsApp sent
 */
router.post('/:id/whatsapp', async (req, res) => {
  try {
    const { phone, message } = req.body;
    await sendWhatsApp(phone, message);
    await updateLead(req.params.id, { last_whatsapp: new Date().toISOString() });
    res.json({ success: true, sent_to: phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
