// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { downscaleImage } from "./downscale";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("photo downscaling", () => {
  it("retains at least one pixel for extreme aspect ratios", async () => {
    const bitmap = { width: 10000, height: 1, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ({ drawImage }) as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback) {
      expect(this.width).toBe(1024);
      expect(this.height).toBe(1);
      callback(new Blob(["jpeg"], { type: "image/jpeg" }));
    });
    expect((await downscaleImage(new File(["image"], "wide.jpg"))).type).toBe("image/jpeg");
    expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it("releases the bitmap if canvas initialization fails", async () => {
    const bitmap = { width: 100, height: 100, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    await expect(downscaleImage(new File(["image"], "image.jpg"))).rejects.toThrow("Canvas nicht verfügbar");
    expect(bitmap.close).toHaveBeenCalledTimes(1);
  });
});
