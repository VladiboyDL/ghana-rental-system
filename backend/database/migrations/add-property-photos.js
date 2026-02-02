const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Curated Unsplash photos realistic for Ghana/West Africa rental properties
// Free to use under Unsplash license
const propertyPhotos = {
  // Residential - Villas (larger homes)
  'R-VL': [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  ],
  // Residential - 4+ Bedroom
  'R-4B+': [
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80',
  ],
  // Residential - 3 Bedroom (common Ghana apartments)
  'R-3B': [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80',
  ],
  // Residential - 2 Bedroom (typical apartments)
  'R-2B': [
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80',
    'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
  ],
  // Residential - 1 Bedroom
  'R-1B': [
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?w=800&q=80',
    'https://images.unsplash.com/photo-1600573472591-ee6c563aaec3?w=800&q=80',
  ],
  // Residential - Self-Contained
  'R-SC': [
    'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800&q=80',
    'https://images.unsplash.com/photo-1600566752734-2a0cd66c42e2?w=800&q=80',
    'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80',
  ],
  // Residential - Single Room
  'R-SR': [
    'https://images.unsplash.com/photo-1600566752229-250ed79470f8?w=800&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80',
  ],
  // Commercial - Office
  'C-OFF': [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
  ],
  // Commercial - Shop
  'C-SH': [
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  ],
  // Commercial - Warehouse
  'C-WH': [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
  ],
  // Commercial - Industrial
  'C-IND': [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  ],
};

// Interior photos - simple, realistic interiors
const interiorPhotos = [
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80', // Living room
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80', // Bedroom
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', // Dining
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&q=80', // Modern interior
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80', // Simple room
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80', // Cozy space
  'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800&q=80', // Bright interior
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Living space
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Kitchen
  'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80', // Bathroom
];

function getRandomPhotos(propertyType, count = 4) {
  const typePhotos = propertyPhotos[propertyType] || propertyPhotos['R-3B'];
  const photos = [];

  // Shuffle arrays to get random selection
  const shuffledExterior = [...typePhotos].sort(() => Math.random() - 0.5);
  const shuffledInterior = [...interiorPhotos].sort(() => Math.random() - 0.5);

  // Add 1-2 exterior photos
  const exteriorCount = Math.min(2, shuffledExterior.length);
  for (let i = 0; i < exteriorCount; i++) {
    photos.push({
      url: shuffledExterior[i],
      caption: i === 0 ? 'Property Exterior' : 'Building View',
      isPrimary: i === 0
    });
  }

  // Add 2-3 interior photos
  const interiorCount = Math.min(count - exteriorCount, shuffledInterior.length);
  const captions = ['Living Area', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Space'];

  for (let i = 0; i < interiorCount; i++) {
    photos.push({
      url: shuffledInterior[i],
      caption: captions[i] || 'Interior',
      isPrimary: false
    });
  }

  return photos;
}

async function addPropertyPhotos() {
  console.log('Adding property photos to database...');

  const client = await pool.connect();

  try {
    // Get all properties
    const result = await client.query(`
      SELECT id, property_code, property_type, photos
      FROM properties
      ORDER BY created_at
    `);

    console.log(`Found ${result.rows.length} properties to update`);

    let updated = 0;

    for (const property of result.rows) {
      // Generate photos for this property type
      const photos = getRandomPhotos(property.property_type, 4);

      // Update property with new photos
      await client.query(`
        UPDATE properties
        SET photos = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [JSON.stringify(photos), property.id]);

      updated++;
      if (updated % 20 === 0) {
        console.log(`  Updated ${updated} properties...`);
      }
    }

    console.log(`\n✅ Successfully updated ${updated} properties with photos`);

  } catch (error) {
    console.error('Error adding photos:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addPropertyPhotos().catch(console.error);
