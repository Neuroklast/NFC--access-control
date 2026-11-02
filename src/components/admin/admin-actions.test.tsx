// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminHeader } from "./admin-header";
import { CardholderDelete } from "./cardholder-delete";
import { LoginForm } from "./login-form";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), error: vi.fn(), success: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: mocks.success } }));

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("admin network failure handling", () => {
  it.each(["network", "server"])("does not report logout on %s failure", async (failure) => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      if (failure === "network") throw new TypeError("Offline");
      return { ok: false, status: 500 };
    }));
    render(<AdminHeader email="admin@example.test" />);
    fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Abmelden" }).hasAttribute("disabled")).toBe(false);
  });

  it("navigates away only after logout succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
    render(<AdminHeader email="admin@example.test" />);
    fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/admin/login"));
  });

  it("keeps a failed delete open for retry and resets confirmation on reopen", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Offline")));
    render(<CardholderDelete id="test-id" fullName="Anna Test" lastName="Test" />);
    fireEvent.click(screen.getByRole("button", { name: "Endgültig löschen" }));
    fireEvent.change(screen.getByLabelText("Zum Bestätigen Nachnamen eingeben: Test"), { target: { value: "Test" } });
    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(mocks.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    fireEvent.click(screen.getByRole("button", { name: "Endgültig löschen" }));
    expect(screen.getByRole("button", { name: "Löschen" }).hasAttribute("disabled")).toBe(true);
  });

  it.each([
    [429, "Zu viele Anmeldeversuche. Bitte später erneut versuchen."],
    [503, "Anmeldung derzeit nicht verfügbar. Bitte erneut versuchen."],
  ])("shows the real login failure for HTTP %s", async (status, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status }));
    render(<LoginForm from="/admin/cardholders" />);
    fireEvent.change(screen.getByLabelText("E-Mail"), { target: { value: "admin@example.test" } });
    fireEvent.change(screen.getByLabelText("Passwort"), { target: { value: "test-password" } });
    fireEvent.submit(screen.getByRole("button", { name: "Anmelden" }).closest("form")!);
    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
