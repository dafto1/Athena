const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected to database.");

  // Add fileData column to Resource table if not exists
  await client.query(`
    ALTER TABLE "Resource"
    ADD COLUMN IF NOT EXISTS "fileData" bytea;
  `);

  // Drop fileUrl column if exists (or keep nullable for backwards compatibility)
  await client.query(`
    ALTER TABLE "Resource"
    DROP COLUMN IF EXISTS "fileUrl";
  `);

  console.log("Database schema updated: fileData (bytea) added, fileUrl removed.");
  await client.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
