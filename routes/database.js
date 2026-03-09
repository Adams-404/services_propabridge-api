const router = require('express').Router();
const { seedDatabase, SAMPLE_PROPERTIES } = require('../data/seed');

/**
 * @swagger
 * /api/db/seed:
 *   post:
 *     tags: [🗄️ Database]
 *     summary: Seed Firestore with 15 sample Abuja properties
 *     description: Populates the database with realistic Nigerian property listings including images, prices in Naira, and agent details.
 *     responses:
 *       200:
 *         description: Database seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 seeded:
 *                   type: integer
 *                 message:
 *                   type: string
 */
router.post('/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({
      success: true,
      seeded: SAMPLE_PROPERTIES.length,
      message: `${SAMPLE_PROPERTIES.length} properties seeded to Firestore`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, tip: 'Make sure GOOGLE_APPLICATION_CREDENTIALS is set' });
  }
});

/**
 * @swagger
 * /api/db/sample:
 *   get:
 *     tags: [🗄️ Database]
 *     summary: Preview all sample property data (in-memory, no DB required)
 *     responses:
 *       200:
 *         description: Sample properties
 */
router.get('/sample', (req, res) => {
  res.json({
    success: true,
    count: SAMPLE_PROPERTIES.length,
    data: SAMPLE_PROPERTIES,
  });
});

/**
 * @swagger
 * /api/db/stats:
 *   get:
 *     tags: [🗄️ Database]
 *     summary: Get database statistics
 *     responses:
 *       200:
 *         description: Stats
 */
router.get('/stats', (req, res) => {
  const rent = SAMPLE_PROPERTIES.filter(p => p.type === 'rent');
  const buy = SAMPLE_PROPERTIES.filter(p => p.type === 'buy');
  const neighborhoods = [...new Set(SAMPLE_PROPERTIES.map(p => p.neighborhood))];

  res.json({
    total_properties: SAMPLE_PROPERTIES.length,
    for_rent: rent.length,
    for_sale: buy.length,
    neighborhoods,
    price_range: {
      rent: {
        min: `₦${Math.min(...rent.map(p => p.price)).toLocaleString()}`,
        max: `₦${Math.max(...rent.map(p => p.price)).toLocaleString()}`,
      },
      buy: {
        min: `₦${Math.min(...buy.map(p => p.price)).toLocaleString()}`,
        max: `₦${Math.max(...buy.map(p => p.price)).toLocaleString()}`,
      },
    },
    verified: SAMPLE_PROPERTIES.filter(p => p.verified).length,
  });
});

module.exports = router;
