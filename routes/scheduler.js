const router = require('express').Router();
const { createViewingEvent, cancelViewingEvent, getAvailableSlots } = require('../services/calendar');
const { saveAppointment, getAppointments } = require('../services/db');
const { sendWhatsApp, templates } = require('../services/twilio');
const { SAMPLE_PROPERTIES } = require('../data/seed');

/**
 * @swagger
 * /api/scheduler/book:
 *   post:
 *     tags: [📅 Scheduler]
 *     summary: Book a property viewing appointment
 *     description: Creates a Google Calendar event, saves to Firestore, and sends WhatsApp confirmation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [property_id, lead_name, lead_phone, date, time]
 *             properties:
 *               property_id:
 *                 type: string
 *                 example: prop_004
 *               lead_name:
 *                 type: string
 *                 example: Aminu Yusuf
 *               lead_phone:
 *                 type: string
 *                 example: "+2348012345678"
 *               lead_email:
 *                 type: string
 *               date:
 *                 type: string
 *                 example: "2025-03-10"
 *               time:
 *                 type: string
 *                 example: "10:00 AM"
 *               session_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment booked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 */
router.post('/book', async (req, res) => {
  try {
    const { property_id, lead_name, lead_phone, lead_email, date, time, session_id } = req.body;

    const property = SAMPLE_PROPERTIES.find(p => p.id === property_id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    // Create Google Calendar event
    let calendarEvent = null;
    try {
      calendarEvent = await createViewingEvent({
        lead: { name: lead_name, phone: lead_phone, email: lead_email, session_id },
        property,
        date,
        time,
      });
    } catch (e) {
      console.warn('Calendar unavailable (non-critical):', e.message);
    }

    // Save appointment
    const appt = await saveAppointment({
      property_id,
      lead_name,
      lead_phone,
      lead_email: lead_email || null,
      property_title: property.title,
      property_address: property.address,
      date,
      time,
      agent_name: property.agent_name,
      agent_phone: property.agent_phone,
      session_id: session_id || null,
      calendar_event_id: calendarEvent?.event_id || null,
      calendar_link: calendarEvent?.event_link || null,
    });

    // Send WhatsApp confirmation
    let whatsappSent = false;
    try {
      await sendWhatsApp(lead_phone, templates.viewingConfirmation(lead_name, property, date, time, property.agent_name));
      whatsappSent = true;
    } catch (e) {
      console.warn('WhatsApp confirmation failed:', e.message);
    }

    res.json({
      success: true,
      appointment: appt,
      calendar_link: calendarEvent?.event_link || null,
      whatsapp_sent: whatsappSent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/scheduler/slots:
 *   get:
 *     tags: [📅 Scheduler]
 *     summary: Get available viewing slots for a date
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *         example: "2025-03-10"
 *     responses:
 *       200:
 *         description: Available time slots
 */
router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    const slots = await getAvailableSlots(date);
    res.json({ success: true, date, slots });
  } catch (err) {
    // Fallback: return generic slots
    res.json({
      success: true, date: req.query.date,
      slots: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']
        .map(time => ({ time, available: true })),
    });
  }
});

/**
 * @swagger
 * /api/scheduler/appointments:
 *   get:
 *     tags: [📅 Scheduler]
 *     summary: Get all scheduled appointments
 *     responses:
 *       200:
 *         description: List of appointments
 */
router.get('/appointments', async (req, res) => {
  try {
    const data = await getAppointments();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.json({ success: true, count: 0, data: [] });
  }
});

/**
 * @swagger
 * /api/scheduler/remind/{appointment_id}:
 *   post:
 *     tags: [📅 Scheduler]
 *     summary: Send viewing reminder (24h or 1h)
 *     parameters:
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [24h, 1h]
 *     responses:
 *       200:
 *         description: Reminder sent
 */
router.post('/remind/:appointment_id', async (req, res) => {
  try {
    const { type } = req.body;
    const appts = await getAppointments();
    const appt = appts.find(a => a.id === req.params.appointment_id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const message = type === '1h'
      ? templates.viewingReminder1h(appt.lead_name, appt.property_title, appt.time, appt.property_address)
      : templates.viewingReminder24h(appt.lead_name, { title: appt.property_title }, appt.time, appt.property_address);

    await sendWhatsApp(appt.lead_phone, message);
    res.json({ success: true, reminder_type: type, sent_to: appt.lead_phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
