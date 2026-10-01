import { readFile } from "node:fs/promises";
import jsQR from "jsqr";
import sharp from "sharp";

const EXPECTED = [
  { file: "public/demo/demo-active.png", uid: "DEMO-ACTIVE" },
  { file: "public/demo/demo-blocked.png", uid: "DEMO-BLOCKED" },
];

let failed = false;

for (const { file, uid } of EXPECTED) {
  const png = await readFile(file);
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  const ok = code?.data === uid;
  console.log(`${ok ? "OK " : "FAIL"} ${file} -> ${code?.data ?? "(nicht dekodierbar)"}`);
  if (!ok) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
