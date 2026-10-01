import { Prisma } from "@prisma/client";
import { cardholderSelect } from "@/lib/cardholders/schema";
import { prisma } from "@/lib/db/prisma";
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

function isKnown(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export function createPrismaStore(): Store {
  return {
    async verifyLookup(cardUid: string): Promise<VerifyLookup> {
      return prisma.cardholder.findUnique({
        where: { cardUid },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          photoUpdatedAt: true,
        },
      });
    },

    async listCardholders(): Promise<CardholderListItem[]> {
      return prisma.cardholder.findMany({
        select: cardholderSelect,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    },

    async findCardholder(id: string): Promise<CardholderListItem | null> {
      return prisma.cardholder.findUnique({ where: { id }, select: cardholderSelect });
    },

    async createCardholder(input: CreateCardholderInput): Promise<CardholderListItem> {
      try {
        return await prisma.cardholder.create({ data: input, select: cardholderSelect });
      } catch (error) {
        if (isKnown(error, "P2002")) {
          throw new ConflictError("card_uid existiert bereits");
        }
        throw error;
      }
    },

    async updateCardholder(
      id: string,
      input: UpdateCardholderInput,
    ): Promise<CardholderListItem | null> {
      try {
        return await prisma.cardholder.update({
          where: { id },
          data: input,
          select: cardholderSelect,
        });
      } catch (error) {
        if (isKnown(error, "P2025")) {
          return null;
        }
        if (isKnown(error, "P2002")) {
          throw new ConflictError("card_uid existiert bereits");
        }
        throw error;
      }
    },

    async deleteCardholder(id: string): Promise<boolean> {
      try {
        await prisma.cardholder.delete({ where: { id } });
        return true;
      } catch (error) {
        if (isKnown(error, "P2025")) {
          return false;
        }
        throw error;
      }
    },

    async getCardholderPhoto(id: string): Promise<PhotoRecord | null> {
      const row = await prisma.cardholder.findUnique({
        where: { id },
        select: { photo: true, photoMime: true },
      });
      if (!row?.photo || !row.photoMime) {
        return null;
      }
      return { photo: new Uint8Array(row.photo), photoMime: row.photoMime };
    },

    async setCardholderPhoto(
      id: string,
      photo: Uint8Array<ArrayBuffer>,
      photoMime: string,
    ): Promise<boolean> {
      try {
        await prisma.cardholder.update({
          where: { id },
          data: { photo, photoMime, photoUpdatedAt: new Date() },
        });
        return true;
      } catch (error) {
        if (isKnown(error, "P2025")) {
          return false;
        }
        throw error;
      }
    },

    async clearCardholderPhoto(id: string): Promise<boolean> {
      try {
        await prisma.cardholder.update({
          where: { id },
          data: { photo: null, photoMime: null, photoUpdatedAt: null },
        });
        return true;
      } catch (error) {
        if (isKnown(error, "P2025")) {
          return false;
        }
        throw error;
      }
    },

    async findAdminByEmail(email: string): Promise<AdminRecord | null> {
      return prisma.adminUser.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true },
      });
    },

    async findAdminById(id: string): Promise<AdminRecord | null> {
      return prisma.adminUser.findUnique({
        where: { id },
        select: { id: true, email: true, passwordHash: true },
      });
    },

    async updateAdminPassword(id: string, passwordHash: string): Promise<void> {
      await prisma.adminUser.update({ where: { id }, data: { passwordHash } });
    },
  };
}
