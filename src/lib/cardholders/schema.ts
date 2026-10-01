import { z } from "zod";

export const CARDHOLDER_ROLES = ["admin", "security", "staff", "vip"] as const;

export const cardUidSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .transform((value) => value.toUpperCase());

export const verifyCardBodySchema = z
  .object({
    card_uid: cardUidSchema,
  })
  .strict();

export const loginBodySchema = z
  .object({
    email: z.string().trim().email().max(320),
    password: z.string().min(1).max(200),
  })
  .strict();

export const cardholderCreateSchema = z
  .object({
    card_uid: cardUidSchema,
    first_name: z.string().trim().min(1).max(80),
    last_name: z.string().trim().min(1).max(80),
    role: z.enum(CARDHOLDER_ROLES).default("staff"),
    is_active: z.boolean().default(true),
  })
  .strict();

export const cardholderPatchSchema = z
  .object({
    card_uid: cardUidSchema.optional(),
    first_name: z.string().trim().min(1).max(80).optional(),
    last_name: z.string().trim().min(1).max(80).optional(),
    role: z.enum(CARDHOLDER_ROLES).optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

export function serializeCardholder(row: {
  id: string;
  cardUid: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    card_uid: row.cardUid,
    first_name: row.firstName,
    last_name: row.lastName,
    role: row.role,
    is_active: row.isActive,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
