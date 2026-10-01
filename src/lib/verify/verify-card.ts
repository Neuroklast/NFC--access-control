export type CardLookup = {
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
} | null;

export type VerifyGranted = {
  granted: true;
  first_name: string;
  last_name: string;
  role: string;
};

export type VerifyDenied = {
  granted: false;
  reason: "unknown" | "inactive";
};

export type VerifyResult = VerifyGranted | VerifyDenied;

export function verifyCard(lookup: CardLookup): VerifyResult {
  if (!lookup) {
    return { granted: false, reason: "unknown" };
  }
  if (!lookup.isActive) {
    return { granted: false, reason: "inactive" };
  }
  return {
    granted: true,
    first_name: lookup.firstName,
    last_name: lookup.lastName,
    role: lookup.role,
  };
}
