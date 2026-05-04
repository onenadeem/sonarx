import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "./client";
import migrations from "../drizzle/migrations";
import { LoadingScreen } from "@/src/components/common/LoadingScreen";
export function MigrationsProvider({ children }) {
  const { success, error } = useMigrations(db, migrations);
  if (error) {
    return (
      <LoadingScreen message={`Database migration error: ${error.message}`} />
    );
  }
  if (!success) {
    return <LoadingScreen message="Setting up database..." />;
  }
  return <>{children}</>;
}
