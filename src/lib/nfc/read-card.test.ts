import { describe, expect, it } from "vitest";
import { extractCardUid } from "./read-card";

const encoder = new TextEncoder();

describe("extractCardUid", () => {
  it("should prefer the hardware serial number", () => {
    expect(
      extractCardUid({
        serialNumber: "04a1b2c3",
        message: { records: [{ recordType: "text", data: encoder.encode("ignored") }] },
      }),
    ).toBe("04A1B2C3");
  });

  it("should decode the browser-provided text payload without stripping UID bytes", () => {
    expect(
      extractCardUid({
        serialNumber: "  ",
        message: { records: [{ recordType: "text", data: new DataView(encoder.encode("abc-99").buffer) }] },
      }),
    ).toBe("ABC-99");
  });

  it("should decode an NDEF url record", () => {
    expect(
      extractCardUid({
        serialNumber: "",
        message: { records: [{ recordType: "url", data: encoder.encode("demo-active") }] },
      }),
    ).toBe("DEMO-ACTIVE");
  });

  it("decodes text using the encoding supplied by Web NFC", () => {
    const bytes = new Uint8Array([0x41, 0, 0x42, 0, 0x43, 0]);
    expect(extractCardUid({ message: { records: [
      { recordType: "text", encoding: "utf-16le", data: bytes },
    ] } })).toBe("ABC");
  });

  it("skips malformed text instead of throwing from the scan callback", () => {
    expect(extractCardUid({ message: { records: [
      { recordType: "text", encoding: "invalid", data: encoder.encode("bad") },
      { recordType: "text", data: encoder.encode("valid") },
    ] } })).toBe("VALID");
  });

  it("should return null when no identifier is present", () => {
    expect(extractCardUid({ serialNumber: "", message: { records: [] } })).toBeNull();
  });
});
