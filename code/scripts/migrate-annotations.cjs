const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected to database.");

  // Create enum if not exists
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "AnnotationType" AS ENUM ('HIGHLIGHT', 'NOTE');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create Annotation table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Annotation" (
      "id" text PRIMARY KEY,
      "type" "AnnotationType" NOT NULL,
      "pageNumber" integer NOT NULL,
      "content" text,
      "color" text DEFAULT '#facc15' NOT NULL,
      "xPct" double precision NOT NULL,
      "yPct" double precision NOT NULL,
      "wPct" double precision DEFAULT 0 NOT NULL,
      "hPct" double precision DEFAULT 0 NOT NULL,
      "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "resourceId" text NOT NULL REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  // Create index
  await client.query(`
    CREATE INDEX IF NOT EXISTS "Annotation_resourceId_userId_pageNumber_idx"
    ON "Annotation"("resourceId", "userId", "pageNumber");
  `);

  console.log("Annotation table and indexes verified/created successfully.");
  await client.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
