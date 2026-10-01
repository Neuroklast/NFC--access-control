"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export function AdminHeader({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/v1/sessions", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
      <Link href="/admin/cardholders" className="flex items-center gap-3">
        <Image
          src="/brand/frc-logo-light.png"
          alt={BRAND.club}
          width={138}
          height={88}
          className="h-7 w-auto"
        />
        <span className="font-heading text-sm font-medium">Kartenverwaltung</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
        <Button variant="outline" render={<Link href="/admin/password" />}>
          Passwort
        </Button>
        <Button variant="outline" onClick={() => void logout()}>
          Abmelden
        </Button>
      </div>
    </header>
  );
}
