export type CardholderListItem = {
  id: string;
  cardUid: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  photoUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VerifyLookup = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  photoUpdatedAt: Date | null;
} | null;

export type CreateCardholderInput = {
  cardUid: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
};

export type UpdateCardholderInput = Partial<CreateCardholderInput>;

export type AdminRecord = {
  id: string;
  email: string;
  passwordHash: string;
};

export type PhotoRecord = {
  photo: Uint8Array;
  photoMime: string;
};

export class ConflictError extends Error {
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export interface Store {
  verifyLookup(cardUid: string): Promise<VerifyLookup>;
  listCardholders(): Promise<CardholderListItem[]>;
  findCardholder(id: string): Promise<CardholderListItem | null>;
  createCardholder(input: CreateCardholderInput): Promise<CardholderListItem>;
  updateCardholder(id: string, input: UpdateCardholderInput): Promise<CardholderListItem | null>;
  deleteCardholder(id: string): Promise<boolean>;
  getCardholderPhoto(id: string): Promise<PhotoRecord | null>;
  setCardholderPhoto(id: string, photo: Uint8Array<ArrayBuffer>, photoMime: string): Promise<boolean>;
  clearCardholderPhoto(id: string): Promise<boolean>;
  findAdminByEmail(email: string): Promise<AdminRecord | null>;
  findAdminById(id: string): Promise<AdminRecord | null>;
  updateAdminPassword(id: string, passwordHash: string): Promise<void>;
}
