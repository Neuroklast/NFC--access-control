import { hashPassword } from "@/lib/auth/password";
import {
  ConflictError,
  type AdminRecord,
  type CardholderListItem,
  type CreateCardholderInput,
  type PhotoRecord,
  type Store,
  type UpdateCardholderInput,
  type VerifyLookup,
} from "@/lib/store/types";

type MemoryCardholder = {
  id: string;
  cardUid: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  photo: Uint8Array | null;
  photoMime: string | null;
  photoUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MemoryAdmin = AdminRecord;

type MemoryDb = {
  seeded: Promise<void> | null;
  cardholders: Map<string, MemoryCardholder>;
  admins: Map<string, MemoryAdmin>;
};

const globalForMemory = globalThis as { __nfcMemoryDb?: MemoryDb };

function db(): MemoryDb {
  if (!globalForMemory.__nfcMemoryDb) {
    globalForMemory.__nfcMemoryDb = {
      seeded: null,
      cardholders: new Map(),
      admins: new Map(),
    };
  }
  return globalForMemory.__nfcMemoryDb;
}

const DEMO_PASSWORD = "demo-password-123";

async function seed(): Promise<void> {
  const store = db();
  if (store.cardholders.size > 0 || store.admins.size > 0) {
    return;
  }

  const now = new Date();
  const demoCards: Array<Omit<MemoryCardholder, "id" | "createdAt" | "updatedAt" | "photo" | "photoMime" | "photoUpdatedAt">> = [
    { cardUid: "DEMO-ACTIVE", firstName: "Anna", lastName: "Meier", role: "staff", isActive: true },
    { cardUid: "DEMO-BLOCKED", firstName: "Ben", lastName: "Schulz", role: "vip", isActive: false },
  ];

  for (const card of demoCards) {
    const id = crypto.randomUUID();
    store.cardholders.set(id, {
      ...card,
      id,
      photo: null,
      photoMime: null,
      photoUpdatedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const email = process.env.ADMIN_EMAIL ?? "admin@club.local";
  const password = process.env.ADMIN_PASSWORD ?? DEMO_PASSWORD;
  const id = crypto.randomUUID();
  store.admins.set(id, { id, email, passwordHash: await hashPassword(password) });
}

async function ready(): Promise<MemoryDb> {
  const store = db();
  if (!store.seeded) {
    store.seeded = seed();
  }
  await store.seeded;
  return store;
}

function toListItem(row: MemoryCardholder): CardholderListItem {
  return {
    id: row.id,
    cardUid: row.cardUid,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role,
    isActive: row.isActive,
    photoUpdatedAt: row.photoUpdatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function byCardUid(store: MemoryDb, cardUid: string): MemoryCardholder | undefined {
  return [...store.cardholders.values()].find((row) => row.cardUid === cardUid);
}

export function createMemoryStore(): Store {
  return {
    async verifyLookup(cardUid: string): Promise<VerifyLookup> {
      const store = await ready();
      const row = byCardUid(store, cardUid);
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
        isActive: row.isActive,
        photoUpdatedAt: row.photoUpdatedAt,
      };
    },

    async listCardholders(): Promise<CardholderListItem[]> {
      const store = await ready();
      return [...store.cardholders.values()]
        .map(toListItem)
        .sort((a, b) =>
          `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`),
        );
    },

    async findCardholder(id: string): Promise<CardholderListItem | null> {
      const store = await ready();
      const row = store.cardholders.get(id);
      return row ? toListItem(row) : null;
    },

    async createCardholder(input: CreateCardholderInput): Promise<CardholderListItem> {
      const store = await ready();
      if (byCardUid(store, input.cardUid)) {
        throw new ConflictError("card_uid existiert bereits");
      }
      const now = new Date();
      const row: MemoryCardholder = {
        id: crypto.randomUUID(),
        ...input,
        photo: null,
        photoMime: null,
        photoUpdatedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      store.cardholders.set(row.id, row);
      return toListItem(row);
    },

    async updateCardholder(
      id: string,
      input: UpdateCardholderInput,
    ): Promise<CardholderListItem | null> {
      const store = await ready();
      const row = store.cardholders.get(id);
      if (!row) {
        return null;
      }
      if (input.cardUid && input.cardUid !== row.cardUid) {
        const existing = byCardUid(store, input.cardUid);
        if (existing && existing.id !== id) {
          throw new ConflictError("card_uid existiert bereits");
        }
      }
      const updated: MemoryCardholder = { ...row, ...input, updatedAt: new Date() };
      store.cardholders.set(id, updated);
      return toListItem(updated);
    },

    async deleteCardholder(id: string): Promise<boolean> {
      const store = await ready();
      return store.cardholders.delete(id);
    },

    async getCardholderPhoto(id: string): Promise<PhotoRecord | null> {
      const store = await ready();
      const row = store.cardholders.get(id);
      if (!row?.photo || !row.photoMime) {
        return null;
      }
      return { photo: row.photo, photoMime: row.photoMime };
    },

    async setCardholderPhoto(
      id: string,
      photo: Uint8Array<ArrayBuffer>,
      photoMime: string,
    ): Promise<boolean> {
      const store = await ready();
      const row = store.cardholders.get(id);
      if (!row) {
        return false;
      }
      store.cardholders.set(id, { ...row, photo, photoMime, photoUpdatedAt: new Date() });
      return true;
    },

    async clearCardholderPhoto(id: string): Promise<boolean> {
      const store = await ready();
      const row = store.cardholders.get(id);
      if (!row) {
        return false;
      }
      store.cardholders.set(id, { ...row, photo: null, photoMime: null, photoUpdatedAt: null });
      return true;
    },

    async findAdminByEmail(email: string): Promise<AdminRecord | null> {
      const store = await ready();
      return [...store.admins.values()].find((admin) => admin.email === email) ?? null;
    },

    async findAdminById(id: string): Promise<AdminRecord | null> {
      const store = await ready();
      return store.admins.get(id) ?? null;
    },

    async updateAdminPassword(id: string, passwordHash: string): Promise<void> {
      const store = await ready();
      const admin = store.admins.get(id);
      if (admin) {
        store.admins.set(id, { ...admin, passwordHash });
      }
    },
  };
}
