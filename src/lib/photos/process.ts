import sharp from "sharp";

const MAX_EDGE = 512;
const MAX_BYTES = 200 * 1024;
const QUALITIES = [80, 65, 50];
// Reject decompression bombs: output is 512 px, so a source above this cannot
// be a real photo the client did not already downscale.
const MAX_INPUT_PIXELS = 2048 * 2048;

function toArrayBufferBytes(source: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new ArrayBuffer(source.byteLength);
  new Uint8Array(copy).set(source);
  return new Uint8Array(copy);
}

export async function toOptimizedWebp(input: Buffer): Promise<Uint8Array<ArrayBuffer>> {
  for (const quality of QUALITIES) {
    const output = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
    if (output.byteLength <= MAX_BYTES) {
      return toArrayBufferBytes(output);
    }
  }
  throw new Error("Bild ist auch nach Komprimierung zu groß");
}
