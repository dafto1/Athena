const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    'SELECT id, title, "fileName", "fileType", "fileSize", "fileData" IS NOT NULL AS has_data, length("fileData") as data_len FROM "Resource"'
  );
  console.log("RESOURCES_IN_DB:", JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
