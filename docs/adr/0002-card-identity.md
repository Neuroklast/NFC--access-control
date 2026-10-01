# ADR-002: Card identity (UID, NDEF, QR)

- Status: accepted
- Date: 2026-09-28
- Deciders: project owner

## Context

Web NFC does not always expose a programmable NDEF payload. iOS Safari has no Web NFC.

## Decision

Primary ID is `NDEFReadingEvent.serialNumber`. Fallback: NDEF text/url record. iOS/desktop: QR or manual UID. Same `card_uid` string in the database.

## Consequences

- Positive: unformatted MIFARE cards work on Android if serial is exposed
- Negative: iOS needs a printed QR
- Follow-ups: optional NFC/QR capture on the admin form
