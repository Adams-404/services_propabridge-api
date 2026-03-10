const router = require('express').Router();
const { getProperties, getProperty } = require('../services/db');
const { SAMPLE_PROPERTIES } = require('../data/seed');

async function fetchProperties(filters = {}) {
  try { return await getProperties(filters); }
  catch {
    let r = SAMPLE_PROPERTIES;
    if (filters.type) r = r.filter(p => p.type === filters.type);
    if (filters.bedrooms) r = r.filter(p => p.bedrooms === parseInt(filters.bedrooms));
    if (filters.neighborhood) r = r.filter(p => p.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase()));
    if (filters.maxPrice) r = r.filter(p => p.price <= filters.maxPrice);
    if (filters.minPrice) r = r.filter(p => p.price >= filters.minPrice);
    if (filters.city) r = r.filter(p => p.city.toLowerCase() === filters.city.toLowerCase());
    return r.slice(0, filters.limit || 20);
  }
}

/**
 * @swagger
 * /api/properties:
 *   get:
 *     tags: [🏠 Properties]
 *     summary: Get all verified property listings
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rent, buy]
 *         description: Listing type
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: integer
 *         description: Number of bedrooms
 *       - in: query
 *         name: neighborhood
 *         schema:
 *           type: string
 *         description: "Neighborhood name (e.g. Gwarinpa, Maitama)"
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price in naira (e.g. 3000000)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *           example: Abuja
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of properties
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
 *                     $ref: '#/components/schemas/Property'
 */
router.get('/', async (req, res) => {
  try {
    const { type, bedrooms, neighborhood, maxPrice, minPrice, city, limit } = req.query;
    const filters = {
      ...(type && { type }),
      ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
      ...(neighborhood && { neighborhood }),
      ...(maxPrice && { maxPrice: parseInt(maxPrice) }),
      ...(minPrice && { minPrice: parseInt(minPrice) }),
      ...(city && { city }),
      limit: parseInt(limit) || 20,
    };
    const data = await fetchProperties(filters);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     tags: [🏠 Properties]
 *     summary: Get a single property by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: prop_001
 *     responses:
 *       200:
 *         description: Property details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 */
router.get('/:id', async (req, res) => {
  try {
    let property = await getProperty(req.params.id).catch(() => null);
    if (!property) property = SAMPLE_PROPERTIES.find(p => p.id === req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ success: true, data: property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
