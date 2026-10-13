const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT role, content, action FROM "NemoMessage" ORDER BY "createdAt" DESC LIMIT 4');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
