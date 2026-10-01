import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/store/mode";

export const dynamic = "force-dynamic";

const CARDS = [
  { uid: "DEMO-ACTIVE", label: "Gültig — grün", note: "aktiver Inhaber (Anna Meier)" },
  { uid: "DEMO-BLOCKED", label: "Gesperrt — rot", note: "gesperrt (Ben Schulz)" },
];

export default async function DemoPage() {
  if (!isDemoMode()) {
    notFound();
  }

  const codes = await Promise.all(
    CARDS.map(async (card) => ({
      ...card,
      svg: await QRCode.toString(card.uid, { type: "svg", margin: 1, width: 220 }),
    })),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Testausweise</h1>
        <p className="text-muted-foreground">
          QR-Code mit dem Scanner prüfen. Der Inhalt entspricht exakt der Karten-UID.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {codes.map((card) => (
          <div
            key={card.uid}
            className="flex flex-col items-center gap-3 rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10"
          >
            <div
              className="rounded-lg bg-white p-3"
              aria-label={`QR-Code für ${card.uid}`}
              dangerouslySetInnerHTML={{ __html: card.svg }}
            />
            <p className="font-mono text-sm">{card.uid}</p>
            <p className="font-medium">{card.label}</p>
            <p className="text-sm text-muted-foreground">{card.note}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Zum Drucken:{" "}
        <Link className="underline underline-offset-2" href="/demo/demo-active.png">
          DEMO-ACTIVE (PNG)
        </Link>{" "}
        ·{" "}
        <Link className="underline underline-offset-2" href="/demo/demo-blocked.png">
          DEMO-BLOCKED (PNG)
        </Link>
      </p>

      <div className="rounded-xl bg-card p-6 text-sm ring-1 ring-foreground/10">
        <h2 className="font-heading mb-2 text-lg font-medium">NFC-Karten</h2>
        <p className="text-muted-foreground">
          Eine echte NFC-Karte ist gültig, wenn ihre UID als Karten-UID gespeichert ist. Android
          liefert die Chip-Seriennummer; diese unter „Karten“ als neue Karte anlegen. Die
          Demo-Werte gelten nur für manuelle Eingabe und QR.
        </p>
      </div>

      <Button variant="outline" render={<Link href="/" />} className="self-start">
        Zum Scanner
      </Button>
    </main>
  );
}
