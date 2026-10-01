"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm({ from }: { from: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.status === 204) {
        router.push(from || "/admin/cardholders");
        router.refresh();
        return;
      }
      setError("E-Mail oder Passwort ungültig");
    } catch {
      setError("Keine Verbindung zum Server");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">E-Mail</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Passwort</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button type="submit" className="min-h-11 w-full" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Anmelden
        </Button>
      </FieldGroup>
    </form>
  );
}
