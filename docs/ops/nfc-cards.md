# Ops — NFC und QR

## Was auf der Karte stehen muss

Gültig ist eine Karte, wenn ihre **UID** als `card_uid` in der Datenbank steht.

- **Android (Web NFC):** Zuerst zählt die Chip-Seriennummer (`serialNumber`). Ein NDEF-Text oder
  -URL-Datensatz wird nur genutzt, wenn keine Seriennummer geliefert wird.
  → Eine echte Karte wird gültig, indem ihre Seriennummer im Admin als Karte angelegt wird.
- **NDEF-Text:** Inhalt muss exakt die UID sein (z. B. `DEMO-ACTIVE`). NDEF-URL genauso.
- **iPhone:** Web NFC ist gesperrt. Auf die Karte einen QR-Code mit der `card_uid` drucken und
  „QR scannen" nutzen. `BarcodeDetector` fehlt auf iOS, deshalb dekodiert die App per `qr-scanner`.

## Demo-Werte

Nur im Demo-Modus (ohne `DATABASE_URL`):

| UID | Ergebnis |
| --- | --- |
| `DEMO-ACTIVE` | Grün, Name + Rolle |
| `DEMO-BLOCKED` | Rot, kein Name |

Test-QR-Codes zeigt die Seite **`/demo`** (nur im Demo-Modus erreichbar). Der QR-Inhalt ist die UID
als reiner Text — **keine URL**.

Fertige Dateien zum Ausdrucken: `public/demo/demo-active.png` und `demo-blocked.png`
(im Betrieb erreichbar unter `/demo/demo-active.png`). Neu erzeugen und prüfen:

```sh
node scripts/generate-demo-qr.mjs
node scripts/verify-demo-qr.mjs
```

## Bedienung am Scanner

- Ergebnis-Screen (grün/rot) hat **„Weiter scannen"** zum sofortigen Zurücksetzen.
- Ohne Tippen springt der Scanner nach 5 Sekunden zurück.
- Abgelehnte Scans zeigen **nie** einen Namen.
- Desktop-Tests: UID in „Karten-UID manuell" eintippen.

## HTTPS

Pflicht für NFC und Kamera. `http://` im WLAN ist kein Secure Context.
