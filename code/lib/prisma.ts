import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function databaseConnectionString(value: string | undefined) {
  if (!value) return value;

  const url = new URL(value);
  if (["prefer", "require", "verify-ca"].includes(url.searchParams.get("sslmode") ?? "")) {
    // Keep pg's current secure behavior explicit before pg v9 changes these modes.
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}

// Neon connection configuration with keepAlive & error handlers
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: databaseConnectionString(process.env.DATABASE_URL),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

// Handle unexpected errors on idle pool clients so they don't crash or hang the server
pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client:", err);
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
