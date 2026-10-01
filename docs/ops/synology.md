# Ops — Synology Docker

1. Copy the repo onto the NAS or build on a PC and load the image.
2. Set `SESSION_SECRET` (≥16 chars) and `ADMIN_PASSWORD` in compose or Synology env.
3. `docker compose up -d --build`
4. Reverse Proxy: HTTPS → container port 3000. Web NFC and camera need a secure context.
5. First login: `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Change the password in the database if the default was used.
6. Seed demo cards: `docker compose exec app npx prisma db seed` (needs `tsx` in the image — run seed from a machine with Node if the runner image is slim).

Migrate runs on container start (`prisma migrate deploy`).
