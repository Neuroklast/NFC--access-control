# Feature Spec — Membership scan

- Feature: NFC/QR Ausweisprüfung
- Owner: NFC Club Access

## Problem

Einlass muss prüfen, ob jemand Club-Mitarbeiter ist — ohne Datenbank-Konsole.

## Acceptance criteria

- [ ] Given NFC, when Scan starten, then UID wird gelesen und Verify aufgerufen.
- [ ] Given aktive Karte, then Vollfläche Grün, Name + Rolle, Reset 4s.
- [ ] Given unbekannt oder inaktiv, then Rot ohne Namen, Reset 4s.
- [ ] Given kein NFC, then QR und manuelle UID bleiben nutzbar.
- [ ] Given offline, then „Keine Verbindung“, nie Grant.

## Scope

- In: Scanner `/`, Verify-API, PWA-Manifest
- Out: Türöffner, Scanner-Login
