// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardholderForm } from "./cardholder-form";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), downscale: vi.fn(), error: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/lib/photos/downscale", () => ({ downscaleImage: mocks.downscale }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", { createObjectURL: () => "blob:preview", revokeObjectURL: vi.fn() });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function fill() {
  fireEvent.change(screen.getByLabelText("Karten-UID"), { target: { value: "TEST-UID" } });
  fireEvent.change(screen.getByLabelText("Vorname"), { target: { value: "Anna" } });
  fireEvent.change(screen.getByLabelText("Nachname"), { target: { value: "Test" } });
  fireEvent.change(screen.getByLabelText("Foto (optional)"), {
    target: { files: [new File(["photo"], "photo.jpg", { type: "image/jpeg" })] },
  });
}
describe("card creation with a partial photo failure", () => {
  it.each(["conversion", "network", "response"])("keeps the saved card on %s failure", async (failure) => {
    mocks.downscale.mockImplementation(async () => {
      if (failure === "conversion") throw new Error("Invalid image");
      return new Blob(["photo"]);
    });
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ status: 201, json: async () => ({ id: "saved-id" }) })
      .mockImplementationOnce(async () => {
        if (failure === "network") throw new TypeError("Offline");
        return { ok: false };
      }));
    render(<CardholderForm />);
    fill();
    fireEvent.submit(screen.getByText("Speichern").closest("form")!);
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/admin/cardholders/saved-id"));
    expect(mocks.error).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(failure === "conversion" ? 1 : 2);
  });
});
