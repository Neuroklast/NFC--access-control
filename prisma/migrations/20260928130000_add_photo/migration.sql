ALTER TABLE "cardholders"
    ADD COLUMN "photo" BYTEA,
    ADD COLUMN "photo_mime" TEXT,
    ADD COLUMN "photo_updated_at" TIMESTAMP(3);
