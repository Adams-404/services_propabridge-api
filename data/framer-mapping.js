/**
 * PROPABRIDGE — Framer CMS → Backend Field Mapping
 * ===================================================
 * 
 * Based on your Framer CMS screenshots, here's exactly what
 * needs updating in the propabridge-agents code.
 */

// ─────────────────────────────────────────────────────────────────────────────
// FRAMER CMS FIELD NAMES  →  OUR BACKEND FIELD NAMES
// ─────────────────────────────────────────────────────────────────────────────

const PROPERTY_FIELD_MAP = {
  // Framer field name          → Our backend field name
  'Listing Title':              'title',
  'Overview':                   'description',
  'Property Status':            'type',           // "For Rent" → "rent", "For Sale" → "buy"
  'Property Category':          'property_type',  // Villa, Apartment, Land, etc.
  'Price':                      'price',          // Was USD — needs Naira
  'Beds':                       'bedrooms',
  'Baths':                      'bathrooms',
  'Size':                       'size_sqm',       // Was sq ft — will convert
  'Neighborhood':               'neighborhood',   // Was US cities — needs Nigeria
  'Location':                   'address',
  'Map Coordinates':            'coordinates',    // lat,lng string
  'Property ID':                'property_id',
  'Slug':                       'slug',
  'Image Thumbnail':            'thumbnail',
  'Image 1–20':                 'images',         // Array of up to 20 images
  'Amenities':                  'features',       // Reference to Amenities collection
  'Agent':                      'agent_name',
  'Featured':                   'featured',       // Boolean
  'Youtube Link':                'video_url',
  'Brochure or Plan':           'brochure_url',
  'Floors':                     'floors',
  'Built in':                   'year_built',
  'Lot Size':                   'lot_size',
  'Parking':                    'parking_spaces',
  'Similar Properties':         'similar_ids',    // Reference to other listings
};

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY STATUS MAPPING
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  'For Rent':  'rent',
  'For Sale':  'buy',
  'Sold':      'sold',
};

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY CATEGORY MAPPING (Framer → Nigerian context)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_MAP = {
  'Villa':              'villa',
  'Single Family Home': 'detached',     // In Nigeria: "Detached House"
  'Luxury Homes':       'luxury',
  'Apartment':          'flat',         // In Nigeria: "Flat" not "Apartment"
  'Office Space':       'commercial',
  'Commercial':         'commercial',
  'Land':               'land',
  'All':                'all',
};

// ─────────────────────────────────────────────────────────────────────────────
// AMENITIES SLUGS (from your Framer collection — 51 items)
// These are the slugs you already have, unchanged
// ─────────────────────────────────────────────────────────────────────────────

const AMENITY_SLUGS = [
  'park',
  'school-university',
  'hospital-clinic',
  'highway-access',
  'near-train-station',
  'near-bus-stop',
  'near-subway',
  'balcony',
  'garden',
  'terrace',
  'intercom',
  'generator-backup',
  'air-conditioning',
  'walk-in-closet',
  'fireplace',
  'lush-green-lawn',
  'central-water-treatment-plan',
  'lake-view',
  'laundry-washer',
  'in-house-grocery-store',
  'private-rooftop-lounge',
  // ... etc (all 51 from your Framer Amenities collection)
];

// Nigerian-specific amenities to ADD to your Framer collection:
const NIGERIA_AMENITIES_TO_ADD = [
  { title: 'BQ (Boys Quarter)',     icon: 'home',         slug: 'bq-boys-quarter' },
  { title: 'Borehole Water',        icon: 'droplets',     slug: 'borehole-water' },
  { title: 'Prepaid Meter',         icon: 'zap',          slug: 'prepaid-meter' },
  { title: 'Ductable AC',           icon: 'wind',         slug: 'ductable-ac' },
  { title: 'CCTV',                  icon: 'camera',       slug: 'cctv' },
  { title: 'Compound Wall/Fence',   icon: 'shield',       slug: 'compound-fence' },
  { title: 'Water Heater',          icon: 'flame',        slug: 'water-heater' },
  { title: 'Pop Ceiling',           icon: 'layout',       slug: 'pop-ceiling' },
  { title: 'Tiled Floors',          icon: 'grid',         slug: 'tiled-floors' },
  { title: 'Kitchen Cabinet',       icon: 'package',      slug: 'kitchen-cabinet' },
  { title: 'Estate/Gated',          icon: 'lock',         slug: 'gated-estate' },
  { title: 'DSTV Pre-wired',        icon: 'tv',           slug: 'dstv-prewired' },
  { title: '24hr Security',         icon: 'shield-check', slug: '24hr-security' },
  { title: 'Staff Quarters',        icon: 'users',        slug: 'staff-quarters' },
  { title: 'Swimming Pool',         icon: 'waves',        slug: 'swimming-pool' },
];

// ─────────────────────────────────────────────────────────────────────────────
// NEIGHBORHOODS — Replace US cities with Nigerian ones
// ─────────────────────────────────────────────────────────────────────────────

// DELETE these from your Framer Neighborhood collection:
const US_NEIGHBORHOODS_TO_DELETE = [
  'Miami Beach, Florida',
  'Beverly Hills, California',
  'Malibu, California',
  'Hawaii',
  'Brickell, Miami',
  'SoHo, New York City',
  'Upper East Side, New York City',
  'Highland Park, Dallas',
  'Pacific Heights, San Francisco',
];

// ADD these to your Framer Neighborhood collection:
const NIGERIA_NEIGHBORHOODS_TO_ADD = [
  {
    title: 'Maitama, Abuja',
    slug: 'maitama',
    subtext_for_hero: 'The most prestigious address in Abuja — home to embassies, government officials, and luxury residences. Known for its tree-lined streets, 24-hour security, and proximity to Transcorp Hilton.',
    city: 'Abuja',
    tier: 'premium',
    avg_rent_range: '₦5M–₦15M/year',
    lat: 9.0802, lng: 7.4984,
  },
  {
    title: 'Asokoro, Abuja',
    slug: 'asokoro',
    subtext_for_hero: 'A quiet, prestigious government district with wide roads, high-end villas, and exceptional security. Home to ministers, diplomats, and senior officials.',
    city: 'Abuja',
    tier: 'premium',
    avg_rent_range: '₦4M–₦12M/year',
    lat: 9.0562, lng: 7.5201,
  },
  {
    title: 'Wuse 2, Abuja',
    slug: 'wuse-2',
    subtext_for_hero: 'Abuja\'s vibrant business and lifestyle hub. Walk to top restaurants, banks, and shopping. A favourite for young professionals and executives who want to be at the centre of it all.',
    city: 'Abuja',
    tier: 'premium',
    avg_rent_range: '₦3.5M–₦9M/year',
    lat: 9.0578, lng: 7.4782,
  },
  {
    title: 'Jabi, Abuja',
    slug: 'jabi',
    subtext_for_hero: 'Trendy, growing, and connected. Jabi is close to the airport, Jabi Lake Mall, and major roads. A smart choice for families and professionals seeking modern living at great value.',
    city: 'Abuja',
    tier: 'mid-range',
    avg_rent_range: '₦2.5M–₦7M/year',
    lat: 9.0811, lng: 7.4372,
  },
  {
    title: 'Gwarinpa, Abuja',
    slug: 'gwarinpa',
    subtext_for_hero: 'West Africa\'s largest housing estate — and one of Abuja\'s best-kept secrets for value. Spacious family homes, excellent schools, and a strong community feel. Perfect for families relocating to Abuja.',
    city: 'Abuja',
    tier: 'mid-range',
    avg_rent_range: '₦1.5M–₦4M/year',
    lat: 9.1092, lng: 7.4021,
  },
  {
    title: 'Utako, Abuja',
    slug: 'utako',
    subtext_for_hero: 'Centrally located with easy access to Wuse, the airport, and Maitama. Utako offers modern duplexes and apartments in a well-organised district beloved by professionals.',
    city: 'Abuja',
    tier: 'mid-range',
    avg_rent_range: '₦2M–₦5M/year',
    lat: 9.0674, lng: 7.4589,
  },
  {
    title: 'Garki, Abuja',
    slug: 'garki',
    subtext_for_hero: 'The geographic heart of Abuja — minutes to government offices, AMAC HQ, and the National Stadium. Ideal for civil servants, NGO workers, and anyone who wants to be central.',
    city: 'Abuja',
    tier: 'mid-range',
    avg_rent_range: '₦1.8M–₦5M/year',
    lat: 9.0516, lng: 7.4889,
  },
  {
    title: 'Kubwa, Abuja',
    slug: 'kubwa',
    subtext_for_hero: 'Abuja\'s most popular satellite town — large, lively, and incredibly affordable. A 25-minute drive to the city centre makes it perfect for budget-conscious renters and first-time buyers.',
    city: 'Abuja',
    tier: 'affordable',
    avg_rent_range: '₦600K–₦2M/year',
    lat: 9.1601, lng: 7.3421,
  },
  {
    title: 'Lokogoma, Abuja',
    slug: 'lokogoma',
    subtext_for_hero: 'A fast-growing residential district with modern estates, good road access, and proximity to Shoprite Lugbe. Lokogoma is where Abuja\'s middle class is building its future.',
    city: 'Abuja',
    tier: 'affordable',
    avg_rent_range: '₦1M–₦2.5M/year',
    lat: 8.9978, lng: 7.4102,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BLOG CATEGORIES — Keep existing ones, just rename to Nigerian context
// ─────────────────────────────────────────────────────────────────────────────

// Current: Guide, News, Lifestyle
// Add: Market Update, Investment, Abuja Living, First-Time Buyers

// ─────────────────────────────────────────────────────────────────────────────
// WHAT CHANGES IN THE BACKEND CODE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FILES THAT NEED UPDATING:
 *
 * 1. data/seed.js
 *    - Field names updated to match Framer CMS exactly
 *    - Prices changed from USD to Naira
 *    - Neighborhoods changed to Abuja
 *    - Size changed from sq ft to sqm (or keep sq ft — just label correctly)
 *    - Property categories mapped to Nigerian types
 *    - Amenities use slugs from your Framer Amenities collection
 *
 * 2. services/firestore.js  →  getProperties() filters
 *    - type filter: query "property_status" not "type"
 *    - bedrooms filter: query "beds" not "bedrooms"  
 *    - neighborhood filter: query "neighborhood" (same)
 *
 * 3. routes/agent.js  →  searchProperties() 
 *    - Add normalizeFramerProperty() to map CMS fields to consistent format
 *
 * 4. prompts/propabridge.js  →  SEARCH_PARSE_PROMPT
 *    - property_type values should match Framer category slugs
 *    - (flat/apartment/villa/land/commercial — not flat/duplex/bungalow)
 *
 * FILES THAT DON'T CHANGE:
 *   - server.js            ✓ unchanged
 *   - services/gemini.js   ✓ unchanged
 *   - services/twilio.js   ✓ unchanged
 *   - services/calendar.js ✓ unchanged
 *   - routes/leads.js      ✓ unchanged
 *   - routes/scheduler.js  ✓ unchanged
 *   - routes/notifications.js ✓ unchanged
 */

module.exports = {
  PROPERTY_FIELD_MAP,
  STATUS_MAP,
  CATEGORY_MAP,
  AMENITY_SLUGS,
  NIGERIA_AMENITIES_TO_ADD,
  NIGERIA_NEIGHBORHOODS_TO_ADD,
};
