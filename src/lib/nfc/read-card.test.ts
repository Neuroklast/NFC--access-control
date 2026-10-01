import { describe, expect, it } from "vitest";
import { extractCardUid } from "./read-card";

describe("extractCardUid", () => {
  it("should prefer the hardware serial number", () => {
    expect(
      extractCardUid({
        serialNumber: "04a1b2c3",
        message: { records: [{ recordType: "text", data: "ignored" }] },
      }),
    ).toBe("04A1B2C3");
  });

  it("should fall back to an NDEF text record", () => {
    const encoder = new TextEncoder();
    expect(
      extractCardUid({
        serialNumber: "  ",
        message: {
          records: [{ recordType: "text", data: encoder.encode("abc-99") }],
        },
      }),
    ).toBe("ABC-99");
  });

  it("should return null when no identifier is present", () => {
    expect(extractCardUid({ serialNumber: "", message: { records: [] } })).toBeNull();
  });
});
