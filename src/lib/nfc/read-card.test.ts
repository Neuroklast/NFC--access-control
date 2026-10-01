import { describe, expect, it } from "vitest";
import { extractCardUid } from "./read-card";

const encoder = new TextEncoder();

function ndefText(text: string, language = "en"): Uint8Array<ArrayBuffer> {
  const lang = encoder.encode(language);
  const status = lang.length & 0x3f;
  const body = encoder.encode(text);
  const out = new Uint8Array(new ArrayBuffer(1 + lang.length + body.length));
  out[0] = status;
  out.set(lang, 1);
  out.set(body, 1 + lang.length);
  return out;
}

describe("extractCardUid", () => {
  it("should prefer the hardware serial number", () => {
    expect(
      extractCardUid({
        serialNumber: "04a1b2c3",
        message: { records: [{ recordType: "text", data: ndefText("ignored") }] },
      }),
    ).toBe("04A1B2C3");
  });

  it("should decode a real NDEF text record with language prefix", () => {
    expect(
      extractCardUid({
        serialNumber: "  ",
        message: { records: [{ recordType: "text", data: ndefText("abc-99") }] },
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

  it("should return null when no identifier is present", () => {
    expect(extractCardUid({ serialNumber: "", message: { records: [] } })).toBeNull();
  });
});
