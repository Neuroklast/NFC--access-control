import Link from "next/link";
import { isDemoMode } from "@/lib/store/mode";

export function DemoBanner() {
  if (!isDemoMode()) {
    return null;
  }
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-border bg-card px-4 py-2 text-center text-xs text-muted-foreground"
    >
      <span>Demo-Modus: keine Datenbank verbunden. Änderungen werden nicht gespeichert.</span>
      <Link href="/demo" className="text-primary underline underline-offset-2">
        Testausweise
      </Link>
    </div>
  );
}
