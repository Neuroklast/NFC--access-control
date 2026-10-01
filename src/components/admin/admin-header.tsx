"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminHeader({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/v1/sessions", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
      <Link href="/admin/cardholders" className="font-heading font-medium">
        Kartenverwaltung
      </Link>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
        <Button variant="outline" onClick={() => void logout()}>
          Abmelden
        </Button>
      </div>
    </header>
  );
}
