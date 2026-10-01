"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, NfcIcon, QrCodeIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BRAND } from "@/lib/brand";
import { extractCardUid } from "@/lib/nfc/read-card";

type ScanStatus =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "qr" }
  | {
      kind: "granted";
      firstName: string;
      lastName: string;
      role: string;
      photoUrl: string | null;
    }
  | { kind: "denied" }
  | { kind: "error"; message: string }
  | { kind: "offline" };

const RESET_MS = 5000;
const VERIFY_TIMEOUT_MS = 6000;

function nfcSupported() {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

export function ScannerScreen() {
  const [status, setStatus] = useState<ScanStatus>({ kind: "idle" });
  const [manualUid, setManualUid] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resetRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qrScannerRef = useRef<{ destroy: () => void } | null>(null);

  const clearReset = () => {
    if (resetRef.current !== null) {
      window.clearTimeout(resetRef.current);
      resetRef.current = null;
    }
  };

  const scheduleReset = useCallback(() => {
    clearReset();
    resetRef.current = window.setTimeout(() => {
      setStatus({ kind: "idle" });
    }, RESET_MS);
  }, []);

  const stopQr = useCallback(() => {
    qrScannerRef.current?.destroy();
    qrScannerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      stopQr();
      clearReset();
    };
  }, [stopQr]);

  const verifyUid = useCallback(
    async (cardUid: string) => {
      if (!navigator.onLine) {
        setStatus({ kind: "offline" });
        return;
      }
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
      try {
        const response = await fetch("/api/v1/card-verifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card_uid: cardUid }),
          signal: controller.signal,
        });
        if (response.status === 200) {
          const body = (await response.json()) as {
            granted: boolean;
            first_name?: string;
            last_name?: string;
            role?: string;
            photo_url?: string | null;
          };
          if (body.granted && body.first_name && body.last_name && body.role) {
            setStatus({
              kind: "granted",
              firstName: body.first_name,
              lastName: body.last_name,
              role: body.role,
              photoUrl: body.photo_url ?? null,
            });
            scheduleReset();
            return;
          }
        }
        if (response.status === 403 || response.status === 404) {
          setStatus({ kind: "denied" });
          scheduleReset();
          return;
        }
        if (response.status === 429) {
          setStatus({ kind: "error", message: "Zu viele Versuche. Bitte kurz warten." });
          return;
        }
        setStatus({ kind: "error", message: "Prüfung fehlgeschlagen. Bitte erneut versuchen." });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setStatus({ kind: "error", message: "Keine Antwort vom Server. Bitte erneut versuchen." });
          return;
        }
        setStatus({ kind: "offline" });
      } finally {
        window.clearTimeout(timeout);
      }
    },
    [scheduleReset],
  );

  const startNfc = useCallback(async () => {
    stopQr();
    if (!nfcSupported() || !window.NDEFReader) {
      setStatus({
        kind: "error",
        message: "NFC wird auf diesem Gerät nicht unterstützt. Bitte QR-Code scannen oder UID eingeben.",
      });
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ kind: "scanning" });
    try {
      const reader = new window.NDEFReader();
      reader.addEventListener("reading", (event) => {
        const uid = extractCardUid(event);
        if (!uid) {
          setStatus({ kind: "error", message: "Karte konnte nicht gelesen werden." });
          return;
        }
        void verifyUid(uid);
      });
      reader.addEventListener("readingerror", () => {
        setStatus({ kind: "error", message: "Karte konnte nicht gelesen werden." });
      });
      await reader.scan({ signal: controller.signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setStatus({
        kind: "error",
        message: "NFC konnte nicht gestartet werden. Bitte Berechtigung und HTTPS prüfen.",
      });
    }
  }, [stopQr, verifyUid]);

  const startQr = useCallback(() => {
    abortRef.current?.abort();
    stopQr();
    setStatus({ kind: "qr" });
  }, [stopQr]);

  useEffect(() => {
    if (status.kind !== "qr") {
      return;
    }
    let cancelled = false;
    const run = async () => {
      const video = videoRef.current;
      if (!video) {
        return;
      }
      try {
        const { default: QrScanner } = await import("qr-scanner");
        if (cancelled) {
          return;
        }
        QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";
        const scanner = new QrScanner(
          video,
          (result) => {
            void verifyUid(result.data.trim());
            stopQr();
          },
          {
            onDecodeError: () => {
              /* keep scanning */
            },
            preferredCamera: "environment",
            maxScansPerSecond: 10,
            highlightScanRegion: false,
            highlightCodeOutline: false,
            returnDetailedScanResult: true,
          },
        );
        qrScannerRef.current = scanner;
        await scanner.start();
      } catch {
        if (!cancelled) {
          setStatus({
            kind: "error",
            message: "Kamera nicht verfügbar. Bitte UID manuell eingeben.",
          });
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
      stopQr();
    };
  }, [status.kind, stopQr, verifyUid]);

  const resetNow = () => {
    clearReset();
    setStatus({ kind: "idle" });
  };

  const submitManual = (event: React.FormEvent) => {
    event.preventDefault();
    const uid = manualUid.trim();
    if (!uid) {
      setManualError("Bitte eine UID eingeben.");
      return;
    }
    setManualError(null);
    void verifyUid(uid);
  };

  const result = status.kind === "granted" || status.kind === "denied";

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {result ? (
        <div
          className={
            status.kind === "granted"
              ? "flex min-h-dvh flex-col items-center justify-center gap-6 bg-grant px-6 py-10 text-grant-foreground"
              : "flex min-h-dvh flex-col items-center justify-center gap-6 bg-destructive px-6 py-10 text-white"
          }
          role="status"
          aria-live="assertive"
        >
          {status.kind === "granted" ? (
            <>
              <CheckIcon className="size-20" aria-hidden="true" />
              {status.photoUrl ? (
                <Image
                  src={status.photoUrl}
                  alt=""
                  width={220}
                  height={220}
                  unoptimized
                  className="size-56 rounded-2xl object-cover ring-4 ring-white/40"
                />
              ) : null}
              <p className="text-center text-4xl font-semibold tracking-tight">Ausweis gültig</p>
              <p className="text-center text-2xl">
                {status.firstName} {status.lastName}
                <span className="mt-2 block text-lg font-normal opacity-90">{status.role}</span>
              </p>
            </>
          ) : (
            <>
              <XIcon className="size-24" aria-hidden="true" />
              <p className="text-center text-4xl font-semibold tracking-tight">Ausweis ungültig</p>
              <p className="text-center text-xl">Karte nicht registriert oder gesperrt</p>
            </>
          )}
          <Button variant="secondary" className="min-h-11" onClick={resetNow}>
            Nächste Prüfung
          </Button>
        </div>
      ) : (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-10">
          <div className="flex flex-col gap-3">
            <Image
              src="/brand/frc-logo-light.png"
              alt={BRAND.club}
              width={138}
              height={88}
              priority
              className="h-10 w-auto"
            />
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{BRAND.app}</h1>
            <p className="text-muted-foreground">
              {status.kind === "scanning"
                ? "Karte auflegen…"
                : status.kind === "qr"
                  ? "QR-Code erfassen"
                  : status.kind === "offline"
                    ? "Keine Verbindung zum Server"
                    : status.kind === "error"
                      ? status.message
                      : nfcSupported()
                        ? "Bereit zum Scannen"
                        : "NFC nicht verfügbar. QR-Code scannen oder UID eingeben."}
            </p>
          </div>

          <video
            ref={videoRef}
            className={status.kind === "qr" ? "w-full rounded-xl bg-card" : "hidden"}
            playsInline
            muted
            aria-label="QR-Kamera"
          />

          <div className="flex flex-col gap-3">
            <Button className="min-h-12 w-full text-base" onClick={() => void startNfc()}>
              <NfcIcon data-icon="inline-start" />
              NFC scannen
            </Button>
            <Button
              variant="outline"
              className="min-h-12 w-full text-base"
              onClick={() => void startQr()}
            >
              <QrCodeIcon data-icon="inline-start" />
              QR-Code scannen
            </Button>
          </div>

          <form onSubmit={submitManual}>
            <FieldGroup>
              <Field data-invalid={Boolean(manualError) || undefined}>
                <FieldLabel htmlFor="manual-uid">Karten-UID (manuell)</FieldLabel>
                <Input
                  id="manual-uid"
                  name="card_uid"
                  value={manualUid}
                  onChange={(event) => setManualUid(event.target.value)}
                  autoComplete="off"
                  aria-invalid={Boolean(manualError)}
                />
                <FieldError errors={manualError ? [{ message: manualError }] : undefined} />
              </Field>
              <Button type="submit" variant="secondary" className="min-h-11">
                Prüfen
              </Button>
            </FieldGroup>
          </form>
        </main>
      )}
    </div>
  );
}
