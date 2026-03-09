/**
 * PROPABRIDGE — Sample Property Data & Seeder
 * 15 realistic Abuja property listings for development and fallback
 */

const SAMPLE_PROPERTIES = [
  // ════════════════════════════════════════════
  // PREMIUM AREA — MAITAMA
  // ════════════════════════════════════════════
  {
    id: 'prop_001',
    title: '4-Bedroom Luxury Detached Duplex in Maitama',
    description: 'Exquisite 4-bedroom fully detached duplex in the heart of Maitama, one of Abuja\'s most prestigious neighborhoods. This property features a spacious living area, modern kitchen with granite countertops, all rooms en-suite with walk-in closets, BQ, ample parking for 4 cars, 24-hour security, and a beautifully landscaped compound. Minutes from Transcorp Hilton and major embassies.',
    type: 'rent',
    property_type: 'duplex',
    price: 8500000,
    price_label: '₦8.5M/year',
    bedrooms: 4,
    bathrooms: 5,
    size_sqm: 350,
    neighborhood: 'Maitama',
    city: 'Abuja',
    state: 'FCT',
    address: '12 Yedseram Street, Maitama, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c0?w=800',
    ],
    features: ['BQ', 'Generator', '24hr Security', 'CCTV', 'Ductable AC', 'Borehole', 'Prepaid Meter', 'Swimming Pool', 'Gated Estate'],
    verified: true,
    agent_name: 'Alhaji Musa Ibrahim',
    agent_phone: '+2348031234567',
    lat: 9.0802,
    lng: 7.4984,
    listed_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 'prop_002',
    title: '5-Bedroom Mansion for Sale in Maitama',
    description: 'Magnificent 5-bedroom fully detached mansion on a 1200sqm plot in prime Maitama. Grand entrance foyer, Italian marble floors throughout, ultra-modern kitchen, home cinema room, staff quarters, generator house, borehole, and manicured gardens. Perfect for diplomats, CEOs, and high-net-worth individuals.',
    type: 'buy',
    property_type: 'detached',
    price: 280000000,
    price_label: '₦280M',
    bedrooms: 5,
    bathrooms: 6,
    size_sqm: 650,
    neighborhood: 'Maitama',
    city: 'Abuja',
    state: 'FCT',
    address: '7 Amazon Street, Maitama, Abuja',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    ],
    features: ['Staff Quarters', 'Swimming Pool', 'Home Cinema', 'Generator', 'Borehole', 'CCTV', 'Ductable AC', 'Compound Fence', '24hr Security'],
    verified: true,
    agent_name: 'Barrister Chioma Eze',
    agent_phone: '+2348051234567',
    lat: 9.0815,
    lng: 7.4956,
    listed_at: '2026-02-18T08:00:00Z',
  },

  // ════════════════════════════════════════════
  // PREMIUM AREA — ASOKORO
  // ════════════════════════════════════════════
  {
    id: 'prop_003',
    title: '3-Bedroom Serviced Flat in Asokoro',
    description: 'Premium 3-bedroom serviced apartment in a gated compound in Asokoro. 24-hour electricity, water, security, and cleaning services included. Modern open-plan kitchen, spacious balcony with city views, fitted wardrobes in all rooms. Walking distance to banks, restaurants, and government offices.',
    type: 'rent',
    property_type: 'flat',
    price: 6000000,
    price_label: '₦6M/year',
    bedrooms: 3,
    bathrooms: 4,
    size_sqm: 200,
    neighborhood: 'Asokoro',
    city: 'Abuja',
    state: 'FCT',
    address: '15 Asokoro Extension, Asokoro, Abuja',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1600573472591-ee6981cf81d0?w=800',
    ],
    features: ['Serviced', 'Generator', 'Borehole', '24hr Security', 'AC', 'Balcony', 'Elevator', 'Prepaid Meter'],
    verified: true,
    agent_name: 'Mr. Emeka Okafor',
    agent_phone: '+2348061234567',
    lat: 9.0562,
    lng: 7.5201,
    listed_at: '2026-02-22T14:00:00Z',
  },

  // ════════════════════════════════════════════
  // PREMIUM AREA — WUSE 2
  // ════════════════════════════════════════════
  {
    id: 'prop_004',
    title: '3-Bedroom Penthouse Apartment in Wuse 2',
    description: 'Stunning penthouse apartment in the vibrant heart of Wuse 2. Open-plan living and dining, floor-to-ceiling windows, designer kitchen with island, all rooms en-suite. Rooftop terrace with panoramic city views. Building has gym, parking, and 24-hour security. Walk to Silverbird Cinemas and top restaurants.',
    type: 'rent',
    property_type: 'flat',
    price: 5500000,
    price_label: '₦5.5M/year',
    bedrooms: 3,
    bathrooms: 3,
    size_sqm: 220,
    neighborhood: 'Wuse 2',
    city: 'Abuja',
    state: 'FCT',
    address: 'Plot 234 Aminu Kano Crescent, Wuse 2, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    ],
    features: ['Penthouse', 'Gym', 'Generator', 'AC', 'CCTV', '24hr Security', 'Rooftop Terrace', 'Fitted Kitchen'],
    verified: true,
    agent_name: 'Mrs. Aisha Bello',
    agent_phone: '+2348071234567',
    lat: 9.0578,
    lng: 7.4782,
    listed_at: '2026-02-25T09:00:00Z',
  },

  // ════════════════════════════════════════════
  // MID-RANGE — GWARINPA (3 listings — popular area)
  // ════════════════════════════════════════════
  {
    id: 'prop_005',
    title: '3-Bedroom Flat in Gwarinpa Estate',
    description: 'Well-finished 3-bedroom flat in a quiet close within Gwarinpa Estate. POP ceiling throughout, tiled floors, fitted kitchen cabinets, all rooms en-suite. Spacious compound with ample parking. Close to schools, markets, and hospitals. Ideal for families seeking value and space.',
    type: 'rent',
    property_type: 'flat',
    price: 2500000,
    price_label: '₦2.5M/year',
    bedrooms: 3,
    bathrooms: 3,
    size_sqm: 150,
    neighborhood: 'Gwarinpa',
    city: 'Abuja',
    state: 'FCT',
    address: '4th Avenue, Gwarinpa Estate, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
      'https://images.unsplash.com/photo-1600573472591-ee6981cf81d0?w=800',
    ],
    features: ['POP Ceiling', 'Tiled Floors', 'Kitchen Cabinet', 'Generator', 'Borehole', 'Prepaid Meter', 'Gated Estate'],
    verified: true,
    agent_name: 'Mr. Tunde Adeyemi',
    agent_phone: '+2348081234567',
    lat: 9.1092,
    lng: 7.4021,
    listed_at: '2026-02-26T11:00:00Z',
  },
  {
    id: 'prop_006',
    title: '4-Bedroom Detached Bungalow in Gwarinpa',
    description: 'Spacious 4-bedroom fully detached bungalow with BQ on a large plot in Gwarinpa. Features include a large living room, dining area, modern kitchen, laundry room, 2-car garage, and well-maintained garden. Perfect for a growing family. Close to Cedarcrest Hospital and NEXT Cash & Carry.',
    type: 'rent',
    property_type: 'bungalow',
    price: 3200000,
    price_label: '₦3.2M/year',
    bedrooms: 4,
    bathrooms: 4,
    size_sqm: 280,
    neighborhood: 'Gwarinpa',
    city: 'Abuja',
    state: 'FCT',
    address: '2nd Avenue Extension, Gwarinpa, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=800',
      'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800',
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800',
    ],
    features: ['BQ', 'Generator', 'Borehole', 'Garage', 'Garden', 'Compound Fence', 'Tiled Floors', 'Water Heater'],
    verified: true,
    agent_name: 'Mr. Tunde Adeyemi',
    agent_phone: '+2348081234567',
    lat: 9.1105,
    lng: 7.4035,
    listed_at: '2026-02-24T16:00:00Z',
  },
  {
    id: 'prop_007',
    title: '4-Bedroom Detached Duplex for Sale in Gwarinpa',
    description: 'Brand new 4-bedroom fully detached duplex for sale in a prime location in Gwarinpa. Features include en-suite bedrooms, spacious BQ, modern kitchen with island, POP ceiling, interlocked compound, and automatic gate. C of O available. Move-in ready.',
    type: 'buy',
    property_type: 'duplex',
    price: 85000000,
    price_label: '₦85M',
    bedrooms: 4,
    bathrooms: 5,
    size_sqm: 320,
    neighborhood: 'Gwarinpa',
    city: 'Abuja',
    state: 'FCT',
    address: '1st Avenue Close, Gwarinpa Estate, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    ],
    features: ['BQ', 'C of O', 'Generator', 'Borehole', 'Automatic Gate', 'POP Ceiling', 'Kitchen Island', 'Interlocked Compound'],
    verified: true,
    agent_name: 'Engr. Abdullahi Suleiman',
    agent_phone: '+2348091234567',
    lat: 9.1088,
    lng: 7.4010,
    listed_at: '2026-02-19T13:00:00Z',
  },

  // ════════════════════════════════════════════
  // MID-RANGE — JABI
  // ════════════════════════════════════════════
  {
    id: 'prop_008',
    title: '3-Bedroom Terrace Duplex in Jabi',
    description: 'Modern 3-bedroom terrace duplex in a gated estate in Jabi. Open-plan ground floor with guest toilet, fitted kitchen, and dining area. All bedrooms upstairs with en-suite bathrooms. BQ at the back. 5 minutes from Jabi Lake Mall and airport road. Excellent for young professionals and families.',
    type: 'rent',
    property_type: 'duplex',
    price: 3500000,
    price_label: '₦3.5M/year',
    bedrooms: 3,
    bathrooms: 4,
    size_sqm: 200,
    neighborhood: 'Jabi',
    city: 'Abuja',
    state: 'FCT',
    address: 'Jabi Lake Axis, Jabi, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c0?w=800',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    ],
    features: ['BQ', 'Generator', 'Gated Estate', 'Fitted Kitchen', 'AC', 'Prepaid Meter', 'Tiled Floors', 'DSTV Pre-wired'],
    verified: true,
    agent_name: 'Mrs. Funke Adeola',
    agent_phone: '+2348101234567',
    lat: 9.0811,
    lng: 7.4372,
    listed_at: '2026-02-23T10:00:00Z',
  },
  {
    id: 'prop_009',
    title: '5-Bedroom Detached Duplex for Sale in Jabi',
    description: 'Executive 5-bedroom fully detached duplex with 2 living rooms, a study, and staff quarters in the heart of Jabi. Marble floors, central air conditioning, modern bathroom fittings, large car park for 5 vehicles. Title: C of O. Close to Jabi Lake Mall, banks and international schools.',
    type: 'buy',
    property_type: 'duplex',
    price: 150000000,
    price_label: '₦150M',
    bedrooms: 5,
    bathrooms: 6,
    size_sqm: 450,
    neighborhood: 'Jabi',
    city: 'Abuja',
    state: 'FCT',
    address: 'Off Jabi-Airport Road, Jabi, Abuja',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    ],
    features: ['Staff Quarters', 'C of O', 'Ductable AC', 'Generator', 'Borehole', 'CCTV', 'Swimming Pool', 'Marble Floors'],
    verified: true,
    agent_name: 'Chief Patrick Nwankwo',
    agent_phone: '+2348111234567',
    lat: 9.0825,
    lng: 7.4388,
    listed_at: '2026-02-17T12:00:00Z',
  },

  // ════════════════════════════════════════════
  // MID-RANGE — UTAKO
  // ════════════════════════════════════════════
  {
    id: 'prop_010',
    title: '2-Bedroom Flat in Utako',
    description: 'Neat 2-bedroom flat in a well-maintained building in Utako. POP ceiling, tiled floors, kitchen cabinets, water heater, and prepaid meter. Ground floor with easy access. Close to Utako Market, banks, and Wuse 2. Perfect for singles, couples, or small families on a budget.',
    type: 'rent',
    property_type: 'flat',
    price: 2200000,
    price_label: '₦2.2M/year',
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 110,
    neighborhood: 'Utako',
    city: 'Abuja',
    state: 'FCT',
    address: 'Plot 45 Utako District, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600573472591-ee6981cf81d0?w=800',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
    ],
    features: ['POP Ceiling', 'Tiled Floors', 'Kitchen Cabinet', 'Water Heater', 'Prepaid Meter', 'Compound Fence'],
    verified: true,
    agent_name: 'Mr. Yusuf Mohammed',
    agent_phone: '+2348121234567',
    lat: 9.0674,
    lng: 7.4589,
    listed_at: '2026-02-21T15:00:00Z',
  },

  // ════════════════════════════════════════════
  // MID-RANGE — GARKI
  // ════════════════════════════════════════════
  {
    id: 'prop_011',
    title: '3-Bedroom Flat in Garki Area 11',
    description: 'Well-located 3-bedroom flat in Garki Area 11, the geographic centre of Abuja. Recently renovated with modern finishes, all rooms en-suite, spacious compound with dedicated parking. 10 minutes to National Stadium, Central Bank, and major government offices. Ideal for civil servants and NGO workers.',
    type: 'rent',
    property_type: 'flat',
    price: 3000000,
    price_label: '₦3M/year',
    bedrooms: 3,
    bathrooms: 3,
    size_sqm: 160,
    neighborhood: 'Garki',
    city: 'Abuja',
    state: 'FCT',
    address: 'Area 11, Garki, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    ],
    features: ['Renovated', 'AC', 'Generator', 'Borehole', 'Prepaid Meter', 'Tiled Floors', 'Compound Fence', 'Parking'],
    verified: true,
    agent_name: 'Mrs. Grace Adamu',
    agent_phone: '+2348131234567',
    lat: 9.0516,
    lng: 7.4889,
    listed_at: '2026-02-15T09:00:00Z',
  },

  // ════════════════════════════════════════════
  // AFFORDABLE — KUBWA
  // ════════════════════════════════════════════
  {
    id: 'prop_012',
    title: '2-Bedroom Flat in Kubwa',
    description: 'Affordable 2-bedroom flat in a gated compound in Kubwa. All rooms en-suite, tiled floors, POP ceiling, kitchen cabinets. Estate has security, good road network, and is close to Kubwa Market and schools. 25-minute drive to the city centre. Best value in Abuja!',
    type: 'rent',
    property_type: 'flat',
    price: 900000,
    price_label: '₦900K/year',
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 90,
    neighborhood: 'Kubwa',
    city: 'Abuja',
    state: 'FCT',
    address: 'PW Estate, Kubwa, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800',
    ],
    features: ['POP Ceiling', 'Tiled Floors', 'Kitchen Cabinet', 'Gated Estate', 'Borehole', 'Prepaid Meter'],
    verified: true,
    agent_name: 'Mr. Hassan Danjuma',
    agent_phone: '+2348141234567',
    lat: 9.1601,
    lng: 7.3421,
    listed_at: '2026-02-24T08:00:00Z',
  },
  {
    id: 'prop_013',
    title: '3-Bedroom Bungalow for Sale in Kubwa',
    description: 'Newly built 3-bedroom detached bungalow for sale in a developing estate in Kubwa. All rooms en-suite, modern finishes, BQ, ample compound space, and genuine title documents. Perfect for first-time buyers looking for an affordable home in Abuja. R of O available.',
    type: 'buy',
    property_type: 'bungalow',
    price: 35000000,
    price_label: '₦35M',
    bedrooms: 3,
    bathrooms: 3,
    size_sqm: 200,
    neighborhood: 'Kubwa',
    city: 'Abuja',
    state: 'FCT',
    address: 'Phase 4, Kubwa Extension, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=800',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    ],
    features: ['BQ', 'Newly Built', 'R of O', 'Borehole', 'POP Ceiling', 'Tiled Floors', 'Kitchen Cabinet', 'Compound Fence'],
    verified: true,
    agent_name: 'Mr. Hassan Danjuma',
    agent_phone: '+2348141234567',
    lat: 9.1615,
    lng: 7.3440,
    listed_at: '2026-02-20T10:00:00Z',
  },

  // ════════════════════════════════════════════
  // AFFORDABLE — LUGBE
  // ════════════════════════════════════════════
  {
    id: 'prop_014',
    title: 'Self-Contained Studio in Lugbe',
    description: 'Clean and affordable self-contained apartment in Lugbe, close to the Nnamdi Azikiwe International Airport. Tiled floors, modern bathroom, kitchenette, and prepaid meter. Perfect for airport workers, singles, or anyone on a tight budget who wants to stay near the city.',
    type: 'rent',
    property_type: 'flat',
    price: 600000,
    price_label: '₦600K/year',
    bedrooms: 1,
    bathrooms: 1,
    size_sqm: 35,
    neighborhood: 'Lugbe',
    city: 'Abuja',
    state: 'FCT',
    address: 'FHA, Lugbe, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c0?w=800',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
    ],
    features: ['Self-Contained', 'Tiled Floors', 'Prepaid Meter', 'Water Heater'],
    verified: true,
    agent_name: 'Mrs. Blessing Okonkwo',
    agent_phone: '+2348151234567',
    lat: 8.9932,
    lng: 7.3789,
    listed_at: '2026-02-25T07:00:00Z',
  },

  // ════════════════════════════════════════════
  // AFFORDABLE — LOKOGOMA
  // ════════════════════════════════════════════
  {
    id: 'prop_015',
    title: '3-Bedroom Terrace Duplex in Lokogoma',
    description: 'Brand new 3-bedroom terrace duplex in a modern estate in Lokogoma. Open-plan living area, fitted kitchen, all rooms en-suite, POP ceiling, and interlocked compound. Growing neighborhood with new amenities popping up. 15 minutes to Shoprite Lugbe. Great value for money!',
    type: 'rent',
    property_type: 'duplex',
    price: 1800000,
    price_label: '₦1.8M/year',
    bedrooms: 3,
    bathrooms: 3,
    size_sqm: 180,
    neighborhood: 'Lokogoma',
    city: 'Abuja',
    state: 'FCT',
    address: 'Sun City Estate, Lokogoma, Abuja',
    images: [
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800',
      'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800',
      'https://images.unsplash.com/photo-1600573472591-ee6981cf81d0?w=800',
    ],
    features: ['Newly Built', 'Fitted Kitchen', 'POP Ceiling', 'Tiled Floors', 'Interlocked Compound', 'Borehole', 'Prepaid Meter', 'Gated Estate'],
    verified: true,
    agent_name: 'Mr. Solomon Okorie',
    agent_phone: '+2348161234567',
    lat: 8.9978,
    lng: 7.4102,
    listed_at: '2026-02-23T14:00:00Z',
  },
];

// ─── Seed Database Function ──────────────────────────────────────────────────
async function seedDatabase() {
  // Only import firebase-admin when actually seeding
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  const db = admin.firestore();
  const batch = db.batch();

  for (const property of SAMPLE_PROPERTIES) {
    const ref = db.collection('properties').doc(property.id);
    batch.set(ref, { ...property, created_at: new Date().toISOString() });
  }

  await batch.commit();
  console.log(`✅ Seeded ${SAMPLE_PROPERTIES.length} properties to Firestore`);
  return SAMPLE_PROPERTIES.length;
}

// ─── CLI Seeder ──────────────────────────────────────────────────────────────
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
  seedDatabase()
    .then(count => { console.log(`Done — ${count} properties`); process.exit(0); })
    .catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
}

module.exports = { SAMPLE_PROPERTIES, seedDatabase };
