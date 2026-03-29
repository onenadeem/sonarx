import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { db } from "@/db/client";

export function useDevDrizzleStudio() {
  if (__DEV__) {
    useDrizzleStudio(db.$client);
  }
}
