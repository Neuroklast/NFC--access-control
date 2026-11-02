export type NdefRecordLike = {
  recordType?: string;
  encoding?: string;
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

// Web NFC exposes the text payload only. Status/language bytes have already
// been parsed by the browser and the encoding is provided separately.
function decodeTextRecord(record: NdefRecordLike): string {
  if (!record.data) return "";
  if (typeof record.data === "string") return record.data.trim();
  try {
    return new TextDecoder(record.encoding || "utf-8", { fatal: true })
      .decode(toBytes(record.data)).replace(/^\uFEFF/, "").trim();
  } catch {
    return "";
  }
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
      text = decodeTextRecord(record);
    } else if (type === "url" || type === "absolute-url") {
      text = decodeUrlRecord(record.data);
    }
    if (text) {
      return text.toUpperCase();
    }
  }
  return null;
}
