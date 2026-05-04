import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "resonar.db";

let nativeDatabase;
let drizzleDb;

function createDatabase(name) {
  nativeDatabase = openDatabaseSync(name, {
    enableChangeListener: true,
  });
  drizzleDb = drizzle(nativeDatabase, { schema });
  return drizzleDb;
}

function ensureOpen() {
  if (!nativeDatabase) {
    createDatabase(DATABASE_NAME);
    return;
  }
  try {
    nativeDatabase.execSync("SELECT 1");
  } catch {
    createDatabase(DATABASE_NAME);
  }
}

// Initialize on first load
createDatabase(DATABASE_NAME);

// Proxy ensures the connection is alive before any query
export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      ensureOpen();
      return drizzleDb[prop];
    },
  },
);

export function closeDatabase() {
  try {
    nativeDatabase?.closeSync();
  } catch {}
  nativeDatabase = null;
  drizzleDb = null;
}
