require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM properties WHERE title ILIKE '%Malibu%'");
  console.log('Properties:', res.rows);
  const res2 = await client.query("SELECT * FROM listings WHERE title ILIKE '%Malibu%'");
  console.log('Listings:', res2.rows);
  await client.end();
}
run();
