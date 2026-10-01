import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "public/brand/frc-logo.png";
const LIGHT = "public/brand/frc-logo-light.png";
const ICON_DIR = "public/icons";
const BACKGROUND = "#161616";

await mkdir(ICON_DIR, { recursive: true });

// The source wordmark is black on transparent. Rebuild it white using its alpha as mask.
const { data, info } = await sharp(SOURCE)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const white = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += 4) {
  white[i] = 255;
  white[i + 1] = 255;
  white[i + 2] = 255;
  white[i + 3] = data[i + 3] ?? 0;
}
const lightLogo = await sharp(white, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim()
  .png()
  .toBuffer();
await sharp(lightLogo).toFile(LIGHT);

async function icon(size, innerRatio, outFile) {
  const inner = Math.round(size * innerRatio);
  const logo = await sharp(lightLogo)
    .resize({ width: inner, height: inner, fit: "inside", withoutEnlargement: false })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outFile);
}

await icon(192, 0.72, `${ICON_DIR}/icon-192.png`);
await icon(512, 0.72, `${ICON_DIR}/icon-512.png`);
await icon(512, 0.56, `${ICON_DIR}/icon-512-maskable.png`);
await icon(180, 0.72, `${ICON_DIR}/apple-touch-icon.png`);

console.log("Brand-Assets erzeugt: frc-logo-light.png, icon-192/512, maskable, apple-touch");
