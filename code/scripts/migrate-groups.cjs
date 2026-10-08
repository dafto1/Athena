const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected to Neon database.");

  // Create GroupRole enum if not exists
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create StudyGroup table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "StudyGroup" (
      "id" text PRIMARY KEY,
      "name" text NOT NULL,
      "description" text,
      "inviteCode" text UNIQUE NOT NULL,
      "createdById" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);

  // Create StudyGroupMember table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "StudyGroupMember" (
      "id" text PRIMARY KEY,
      "groupId" text NOT NULL REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "role" "GroupRole" DEFAULT 'MEMBER' NOT NULL,
      "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT "StudyGroupMember_groupId_userId_key" UNIQUE ("groupId", "userId")
    );
  `);

  // Create StudyGroupFolder table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "StudyGroupFolder" (
      "id" text PRIMARY KEY,
      "name" text NOT NULL,
      "groupId" text NOT NULL REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT "StudyGroupFolder_groupId_name_key" UNIQUE ("groupId", "name")
    );
  `);

  // Create GroupResource table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "GroupResource" (
      "id" text PRIMARY KEY,
      "groupId" text NOT NULL REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "resourceId" text NOT NULL REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "sharedById" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "folderId" text REFERENCES "StudyGroupFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT "GroupResource_groupId_resourceId_key" UNIQUE ("groupId", "resourceId")
    );
  `);

  // Create indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS "StudyGroup_createdById_idx" ON "StudyGroup"("createdById");
    CREATE INDEX IF NOT EXISTS "StudyGroup_inviteCode_idx" ON "StudyGroup"("inviteCode");
    CREATE INDEX IF NOT EXISTS "StudyGroupMember_userId_idx" ON "StudyGroupMember"("userId");
    CREATE INDEX IF NOT EXISTS "StudyGroupMember_groupId_idx" ON "StudyGroupMember"("groupId");
    CREATE INDEX IF NOT EXISTS "StudyGroupFolder_groupId_idx" ON "StudyGroupFolder"("groupId");
    CREATE INDEX IF NOT EXISTS "GroupResource_groupId_idx" ON "GroupResource"("groupId");
    CREATE INDEX IF NOT EXISTS "GroupResource_resourceId_idx" ON "GroupResource"("resourceId");
    CREATE INDEX IF NOT EXISTS "GroupResource_sharedById_idx" ON "GroupResource"("sharedById");
  `);

  console.log("Study Group tables and indexes created successfully in Neon Postgres.");
  await client.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
