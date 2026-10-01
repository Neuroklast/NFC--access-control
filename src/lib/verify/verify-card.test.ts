import { describe, expect, it } from "vitest";
import { verifyCard } from "./verify-card";

describe("verifyCard", () => {
  it("should grant access when the cardholder is active", () => {
    expect(
      verifyCard({
        firstName: "Anna",
        lastName: "Meier",
        role: "staff",
        isActive: true,
      }),
    ).toEqual({
      granted: true,
      first_name: "Anna",
      last_name: "Meier",
      role: "staff",
    });
  });

  it("should deny as unknown when no cardholder exists", () => {
    expect(verifyCard(null)).toEqual({ granted: false, reason: "unknown" });
  });

  it("should deny as inactive when the cardholder is blocked", () => {
    expect(
      verifyCard({
        firstName: "Ben",
        lastName: "Schulz",
        role: "vip",
        isActive: false,
      }),
    ).toEqual({ granted: false, reason: "inactive" });
  });
});
