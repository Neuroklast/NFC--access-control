# Testing — Geräte-Matrix (Einlass)

Alle Tests laufen gegen die **NAS-HTTPS-URL**, nicht gegen `http://localhost`. NFC und Kamera brauchen einen Secure Context.

Vorbereitung: Admin eingeloggt, drei Karten im Bestand — **aktiv**, **gesperrt** (`is_active=false`), **unbekannt** (UID nicht in der DB). Foto beim aktiven Inhaber hinterlegt.

## Matrix

| # | Gerät / Weg | Vorgehen | Erwartet |
| --- | --- | --- | --- |
| 1 | Android Chrome, NFC, aktiv | „Scan starten", Karte auflegen | Grün, Name + Rolle + Foto, Reset nach ~5 s |
| 2 | Android Chrome, NFC, gesperrt | wie 1 | Rot, „Karte unbekannt oder gesperrt", **kein** Name |
| 3 | Android Chrome, NFC, unbekannt | wie 1 | Rot, kein Name |
| 4 | iPhone Safari, QR, aktiv | „QR scannen", QR ins Bild | Grün, Name + Rolle + Foto |
| 5 | iPhone Safari, QR, gesperrt | wie 4 | Rot, kein Name |
| 6 | iPhone Safari, QR, unbekannt | wie 4 | Rot, kein Name |
| 7 | iPhone Safari, manuelle UID | UID eintippen → „Prüfen" | wie 4–6 |
| 8 | Schlechte Verbindung | DevTools/Netz auf „Slow 3G", scannen | „Keine Antwort. Erneut versuchen." nach ~6 s, kein Hänger |
| 9 | Offline | Flugmodus, scannen | „Keine Verbindung", **nie** Grün |
| 10 | HTTPS-Zertifikat | NAS-URL öffnen | Gültig, keine Warnung, Schloss |
| 11 | PWA installiert | „Zum Home-Bildschirm", starten | Vollbild, dunkel, Scanner nutzbar |
| 12 | Kamera verweigert | Berechtigung ablehnen | Klare Meldung, manuelle UID bleibt nutzbar |
| 13 | Rate-Limit | >30 Scans/Minute | 429 → „Zu viele Versuche. Kurz warten." |
| 14 | Admin: Sperren | Karte sperren → am Einlass scannen | Rot |
| 15 | Admin: Foto | Foto hochladen → scannen | Foto erscheint |

## Bekannte Grenzen

- Web NFC nur Android Chrome. iOS hat kein Web NFC → QR ist der iOS-Weg.
- `BarcodeDetector` fehlt auf iOS; die App nutzt deshalb `qr-scanner` mit eigenem Decoder.
- Desktop ist kein Zielgerät; manuelle UID dient nur zum Testen.

## Ergebnis festhalten

Pro Durchlauf: Datum, Gerät/OS/Browser-Version, Ergebnis, Abweichung. Fehlschläge als Issue mit Repro-Schritten.
