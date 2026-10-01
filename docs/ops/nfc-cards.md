# Ops — NFC und QR

- **Android Chrome:** „Scan starten". Die App nutzt zuerst die Chip-Seriennummer, dann einen NDEF-Text-Datensatz.
- **iPhone:** Web NFC ist in Safari gesperrt. Auf die Karte einen QR-Code mit der `card_uid` drucken und „QR scannen" nutzen. `BarcodeDetector` fehlt auf iOS, deshalb dekodiert die App per `qr-scanner`.
- **Desktop-Tests:** UID in „Karten-UID manuell" eintippen. Demo-Werte mit `SEED_DEMO=1`: `DEMO-ACTIVE` (grün), `DEMO-BLOCKED` (rot).
- **HTTPS ist Pflicht** für NFC und Kamera. `http://` im WLAN ist kein Secure Context.
- **Foto:** Bei hinterlegtem Foto zeigt der grüne Screen das Bild groß. Der Zugriff läuft über eine signierte, 60 s gültige URL.
- Abgelehnte Scans zeigen **nie** einen Namen.
