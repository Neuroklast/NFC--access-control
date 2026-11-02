# Changelog

## Unreleased

### Fixed

- Scanner: cancel obsolete verifications when changing methods, going offline or unmounting. Ignore late response bodies and old NFC events. Show verification progress and keep repeated QR-start clicks from stopping the camera.
- Scanner: allow content to grow on small displays and associate manual UID errors with their input.
- NFC: decode the browser-provided text payload using the record encoding instead of stripping an NDEF header a second time.
- Card creation: retain the saved card and open its edit page when image conversion or upload fails.
- Passwords: reject new passwords longer than bcrypt's 72-byte UTF-8 limit. Preserve existing login compatibility and limit password-change attempts per account.
- API: include Retry-After on rate-limit responses and prevent caching problem responses.
- Docker: seed requested demo cards on startup using the existing idempotent seed script.
- Windows backup: reject failed or empty database dumps, stage compressed output before publishing it, and generate locale-independent timestamps.

### Validation

- Regression tests cover scanner races, QR restart, browser NFC payloads, partial photo failures, password limits, authorization and rate-limit responses.
- Real Android NFC, iPhone camera, Docker startup and Windows backup execution require target-device checks in docs/testing/device-matrix.md.
