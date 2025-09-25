import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  if (!client) {
    // Disable prefetch as it's not supported for "Transaction" pool mode
    client = postgres(process.env.DATABASE_URL, { prepare: false });
  }

  if (!dbInstance) {
    dbInstance = drizzle(client, { schema });
  }

  return dbInstance;
}

// Create a proxy to lazily initialize the database connection
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const database = getDb();
    const value = (database as unknown as Record<string, unknown>)[
      prop as string
    ];
    return typeof value === "function" ? value.bind(database) : value;
  },
});

export type Database = typeof db;
