export type NdefRecordLike = {
  recordType?: string;
  data?: BufferSource | string;
};

export type NfcReadingLike = {
  serialNumber?: string;
  message?: { records?: NdefRecordLike[] };
};

function decodeRecordData(data: BufferSource | string | undefined): string {
  if (!data) {
    return "";
  }
  if (typeof data === "string") {
    return data.trim();
  }
  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return new TextDecoder().decode(bytes).replace(/^\uFEFF/, "").trim();
}

export function extractCardUid(reading: NfcReadingLike): string | null {
  const serial = reading.serialNumber?.trim();
  if (serial) {
    return serial.toUpperCase();
  }
  const records = reading.message?.records ?? [];
  for (const record of records) {
    if (record.recordType === "text" || record.recordType === "url") {
      const text = decodeRecordData(record.data);
      if (text) {
        return text.toUpperCase();
      }
    }
  }
  return null;
}
