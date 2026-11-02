"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export function AdminHeader({ email }: { email: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/v1/sessions", { method: "DELETE" });
      if (!response.ok) {
        toast.error("Abmelden fehlgeschlagen. Bitte erneut versuchen.");
        return;
      }
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Keine Verbindung zum Server. Abmeldung bitte erneut versuchen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
      <Link href="/admin/cardholders" className="flex items-center gap-3">
        <Image src="/brand/frc-logo-light.png" alt={BRAND.club} width={44} height={28} />
        <span className="font-heading text-sm font-medium">Kartenverwaltung</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/password" />}>
          Passwort
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => void logout()}>
          Abmelden
        </Button>
      </div>
    </header>
  );
}
