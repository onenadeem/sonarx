import { createContext, useContext } from "react";
import { db } from "@/db/client";
const DatabaseContext = createContext(undefined);
export function DatabaseProvider({ children }) {
    return (<DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>);
}
export function useDb() {
    const context = useContext(DatabaseContext);
    if (context === undefined) {
        throw new Error("useDb must be used within a DatabaseProvider");
    }
    return context;
}
