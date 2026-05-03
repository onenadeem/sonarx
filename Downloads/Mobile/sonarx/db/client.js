import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "resonar.db";

function createDatabase(name) {
    const database = openDatabaseSync(name, {
        enableChangeListener: true,
    });
    return drizzle(database, { schema });
}

export const db = createDatabase(DATABASE_NAME);
