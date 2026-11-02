// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScannerScreen } from "./scanner-screen";

vi.mock("next/image", () => ({ default: () => null }));
const qr = vi.hoisted(() => ({ start: vi.fn(), destroy: vi.fn() }));
vi.mock("qr-scanner", () => ({ default: class {
  start = qr.start;
  destroy = qr.destroy;
} }));
const readers: { reading?: (event: { serialNumber: string }) => void }[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function grant(name: string) {
  return { granted: true, first_name: name, last_name: "Test", role: "staff" };
}
async function manual(uid: string) {
  if (screen.queryByText("UID manuell eingeben")) {
    fireEvent.click(screen.getByText("UID manuell eingeben"));
  }
  fireEvent.change(screen.getByLabelText("Karten-UID"), { target: { value: uid } });
  await act(async () => { fireEvent.click(screen.getByText("Prüfen")); });
}

beforeEach(() => {
  vi.useFakeTimers();
  readers.length = 0;
  vi.clearAllMocks();
  Object.defineProperty(window, "NDEFReader", { configurable: true, value: class {
    reading?: (event: { serialNumber: string }) => void;
    constructor() { readers.push(this); }
    addEventListener(type: string, callback: (event: { serialNumber: string }) => void) {
      if (type === "reading") Object.assign(this, { reading: callback });
    }
    async scan() {}
  } });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("scanner request lifecycle", () => {
  it("keeps an active QR camera running when its button is pressed again", async () => {
    render(<ScannerScreen />);
    await act(async () => { fireEvent.click(screen.getByText("QR-Code scannen")); });
    await act(async () => { await vi.dynamicImportSettled(); });
    expect(qr.start).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent.click(screen.getByText("QR-Code scannen")); });
    expect(qr.destroy).not.toHaveBeenCalled();
  });

  it("ignores a completed old body after switching to another scan", async () => {
    const body = deferred<ReturnType<typeof grant>>();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, json: () => body.promise }));
    render(<ScannerScreen />);
    await manual("OLD");
    expect(screen.getByText("Karte wird geprüft…")).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByText("NFC scannen")); });
    await act(async () => { body.resolve(grant("Old")); });
    expect(screen.queryByText("Ausweis gültig")).toBeNull();
    expect(screen.getByText("Karte auflegen…")).toBeTruthy();
  });

  it("clears the previous result timer before a new NFC scan", async () => {
    const next = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ status: 200, json: async () => grant("First") })
      .mockReturnValueOnce(next.promise));
    render(<ScannerScreen />);
    await act(async () => { fireEvent.click(screen.getByText("NFC scannen")); });
    await act(async () => { readers[0].reading?.({ serialNumber: "FIRST" }); });
    expect(screen.getByText("Ausweis gültig")).toBeTruthy();
    // The old NFC listener must no longer trigger more checks behind the result.
    await act(async () => { readers[0].reading?.({ serialNumber: "UNINTENDED" }); });
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Nächste Prüfung"));
    await act(async () => { fireEvent.click(screen.getByText("NFC scannen")); });
    await act(async () => { readers[1].reading?.({ serialNumber: "SECOND" }); });
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText("Karte wird geprüft…")).toBeTruthy();
  });

  it("invalidates a pending request even when the next attempt is offline", async () => {
    const pending = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending.promise));
    render(<ScannerScreen />);
    await manual("FIRST");
    await act(async () => { fireEvent.click(screen.getByText("NFC scannen")); });
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await act(async () => { readers[0].reading?.({ serialNumber: "SECOND" }); });
    await act(async () => {
      pending.resolve({ status: 200, json: async () => grant("Old") } as Response);
    });
    expect(screen.getByText("Keine Verbindung zum Server")).toBeTruthy();
    expect(screen.queryByText("Ausweis gültig")).toBeNull();
    vi.restoreAllMocks();
  });
});
