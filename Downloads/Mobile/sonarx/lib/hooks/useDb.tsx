import { useContext, createContext, type ReactNode } from "react";
import { db, type Database } from "@/db/client";

const DatabaseContext = createContext<Database | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
}

export function useDb(): Database {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDb must be used within a DatabaseProvider");
  }
  return context;
}
