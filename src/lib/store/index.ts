import { createMemoryStore } from "@/lib/store/memory-store";
import { isDemoMode } from "@/lib/store/mode";
import { createPrismaStore } from "@/lib/store/prisma-store";
import type { Store } from "@/lib/store/types";

let store: Store | null = null;

export function getStore(): Store {
  if (!store) {
    store = isDemoMode() ? createMemoryStore() : createPrismaStore();
  }
  return store;
}

export { isDemoMode };
export { ConflictError } from "@/lib/store/types";
export type { Store } from "@/lib/store/types";
