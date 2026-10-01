"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function PasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("current_password") ?? "");
    const newPassword = String(data.get("new_password") ?? "");
    if (newPassword.length < 12) {
      setError("Neues Passwort braucht mindestens 12 Zeichen.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/admin/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (response.status === 204) {
        toast.success("Passwort geändert");
        form.reset();
        return;
      }
      if (response.status === 403) {
        setError("Aktuelles Passwort ist falsch.");
        return;
      }
      setError("Ändern fehlgeschlagen.");
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
          <FieldLabel htmlFor="current_password">Aktuelles Passwort</FieldLabel>
          <Input
            id="current_password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new_password">Neues Passwort</FieldLabel>
          <Input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
          />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button type="submit" className="min-h-11" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Passwort ändern
        </Button>
      </FieldGroup>
    </form>
  );
}
