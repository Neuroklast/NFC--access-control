import { mkdir, writeFile } from "node:fs/promises";
import QRCode from "qrcode";

const OUT_DIR = "public/demo";
const CARDS = [
  { uid: "DEMO-ACTIVE", file: "demo-active" },
  { uid: "DEMO-BLOCKED", file: "demo-blocked" },
];

await mkdir(OUT_DIR, { recursive: true });

for (const card of CARDS) {
  const svg = await QRCode.toString(card.uid, { type: "svg", margin: 2, width: 512 });
  await writeFile(`${OUT_DIR}/${card.file}.svg`, svg);
  await QRCode.toFile(`${OUT_DIR}/${card.file}.png`, card.uid, { margin: 2, width: 512 });
  console.log(`${OUT_DIR}/${card.file}.svg|png -> ${card.uid}`);
}
