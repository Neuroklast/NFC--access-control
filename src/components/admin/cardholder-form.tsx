"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CARDHOLDER_ROLES } from "@/lib/cardholders/schema";
import { downscaleImage } from "@/lib/photos/downscale";

export type CardholderFormValues = {
  card_uid: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
};

export function CardholderForm({
  id,
  initial,
  hasPhoto = false,
}: {
  id?: string;
  initial?: CardholderFormValues;
  hasPhoto?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!preview) {
      return;
    }
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function uploadPhoto(cardholderId: string, selected: File) {
    const blob = await downscaleImage(selected);
    const response = await fetch(`/api/v1/cardholders/${cardholderId}/photo`, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: blob,
    });
    if (!response.ok) {
      toast.error("Foto konnte nicht gespeichert werden");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      card_uid: String(data.get("card_uid") ?? ""),
      first_name: String(data.get("first_name") ?? ""),
      last_name: String(data.get("last_name") ?? ""),
      role: String(data.get("role") ?? "staff"),
      is_active: data.get("is_active") === "on",
    };
    setPending(true);
    setError(null);
    try {
      const response = await fetch(id ? `/api/v1/cardholders/${id}` : "/api/v1/cardholders", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 201 || response.status === 200) {
        const saved = (await response.json()) as { id: string };
        if (file) {
          await uploadPhoto(saved.id, file);
        }
        toast.success(id ? "Karte gespeichert" : "Karte angelegt");
        router.push("/admin/cardholders");
        router.refresh();
        return;
      }
      if (response.status === 409) {
        setError("Diese Karten-UID existiert bereits.");
        return;
      }
      setError("Speichern fehlgeschlagen.");
    } catch {
      setError("Keine Verbindung");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="card_uid">Karten-UID</FieldLabel>
          <Input
            id="card_uid"
            name="card_uid"
            required
            defaultValue={initial?.card_uid}
            autoComplete="off"
            className="font-mono"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="first_name">Vorname</FieldLabel>
          <Input id="first_name" name="first_name" required defaultValue={initial?.first_name} />
        </Field>
        <Field>
          <FieldLabel htmlFor="last_name">Nachname</FieldLabel>
          <Input id="last_name" name="last_name" required defaultValue={initial?.last_name} />
        </Field>
        <Field>
          <FieldLabel htmlFor="role">Rolle</FieldLabel>
          <select
            id="role"
            name="role"
            defaultValue={initial?.role ?? "staff"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            {CARDHOLDER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </Field>
        <Field orientation="horizontal">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked={initial?.is_active ?? true}
            className="size-4"
          />
          <FieldLabel htmlFor="is_active">Aktiv</FieldLabel>
        </Field>
        <Field>
          <FieldLabel htmlFor="photo">Foto (optional)</FieldLabel>
          <FieldDescription>
            Wird automatisch verkleinert und als WebP gespeichert.
          </FieldDescription>
          <div className="flex items-center gap-4">
            {preview ? (
              <Image
                src={preview}
                alt="Vorschau"
                width={64}
                height={64}
                unoptimized
                className="size-16 rounded-lg object-cover"
              />
            ) : id && hasPhoto ? (
              <Image
                src={`/api/v1/cardholders/${id}/photo`}
                alt="Aktuelles Foto"
                width={64}
                height={64}
                unoptimized
                className="size-16 rounded-lg object-cover"
              />
            ) : null}
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm"
            />
          </div>
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button type="submit" className="min-h-11" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Speichern
        </Button>
      </FieldGroup>
    </form>
  );
}
