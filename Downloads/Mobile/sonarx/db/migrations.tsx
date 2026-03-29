import { useEffect, useState } from "react";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "./client";
import migrations from "../drizzle/migrations";
import { LoadingScreen } from "@/components/common/LoadingScreen";

interface MigrationsProviderProps {
  children: React.ReactNode;
}

export function MigrationsProvider({ children }: MigrationsProviderProps) {
  const { success, error } = useMigrations(db, migrations);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (success) {
      setIsReady(true);
    }
  }, [success]);

  if (error) {
    return (
      <LoadingScreen message={`Database migration error: ${error.message}`} />
    );
  }

  if (!isReady) {
    return <LoadingScreen message="Setting up database..." />;
  }

  return <>{children}</>;
}
