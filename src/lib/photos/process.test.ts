import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { toOptimizedWebp } from "./process";

describe("toOptimizedWebp", () => {
  it("should convert a large image to webp and cap the longest edge", async () => {
    const input = await sharp({
      create: { width: 1600, height: 1200, channels: 3, background: "#888888" },
    })
      .png()
      .toBuffer();

    const output = await toOptimizedWebp(input);

    expect(output.byteLength).toBeLessThanOrEqual(200 * 1024);
    const meta = await sharp(Buffer.from(output)).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(512);
  });

  it("should not enlarge a small image", async () => {
    const input = await sharp({
      create: { width: 100, height: 80, channels: 3, background: "#333333" },
    })
      .png()
      .toBuffer();

    const output = await toOptimizedWebp(input);
    const meta = await sharp(Buffer.from(output)).metadata();

    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(80);
  });
});
