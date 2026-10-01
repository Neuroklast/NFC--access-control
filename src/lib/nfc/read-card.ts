export type NdefRecordLike = {
  recordType?: string;
  data?: BufferSource | string;
};

export type NfcReadingLike = {
  serialNumber?: string;
  message?: { records?: NdefRecordLike[] };
};

function toBytes(data: BufferSource): Uint8Array {
  return data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "").trim();
}

// NDEF Text record: [status byte][language code][text].
// status & 0x80 -> UTF-16, status & 0x3f -> language code length.
function decodeTextRecord(data: BufferSource | string | undefined): string {
  if (!data) {
    return "";
  }
  if (typeof data === "string") {
    return data.trim();
  }
  const bytes = toBytes(data);
  if (bytes.length === 0) {
    return "";
  }
  const status = bytes[0] ?? 0;
  const languageLength = status & 0x3f;
  const isUtf16 = (status & 0x80) !== 0;
  const textBytes = bytes.slice(1 + languageLength);
  const decoder = new TextDecoder(isUtf16 ? "utf-16le" : "utf-8");
  return decoder.decode(textBytes).replace(/^\uFEFF/, "").trim();
}

function decodeUrlRecord(data: BufferSource | string | undefined): string {
  if (!data) {
    return "";
  }
  if (typeof data === "string") {
    return data.trim();
  }
  return decodeUtf8(toBytes(data));
}

export function extractCardUid(reading: NfcReadingLike): string | null {
  const serial = reading.serialNumber?.trim();
  if (serial) {
    return serial.toUpperCase();
  }
  const records = reading.message?.records ?? [];
  for (const record of records) {
    const type = record.recordType?.toLowerCase();
    let text = "";
    if (type === "text") {
      text = decodeTextRecord(record.data);
    } else if (type === "url" || type === "absolute-url") {
      text = decodeUrlRecord(record.data);
    }
    if (text) {
      return text.toUpperCase();
    }
  }
  return null;
}
