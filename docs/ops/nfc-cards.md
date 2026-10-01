# Ops — NFC and QR

- Android Chrome: tap **Scan starten**. The app uses the chip serial, then NDEF text.
- iOS: Web NFC is blocked. Print `card_uid` as QR on the card. Use **QR scannen**.
- Desktop tests: type the UID into **Karten-UID manuell**. Demo values after seed: `DEMO-ACTIVE` (green), `DEMO-BLOCKED` (red).
- HTTPS required for NFC and camera.
- Denied scans never show a name.
