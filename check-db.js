require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    
    // Check tables
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables:', res.rows.map(r => r.table_name));
    
    if (res.rows.length > 0) {
      for (const row of res.rows) {
        const table = row.table_name;
        const schema = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [table]);
        console.log(`Schema for ${table}:`, schema.rows.map(c => `${c.column_name} (${c.data_type})`));
      }
    } else {
        console.log('No tables found in public schema.');
    }
  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

run();
