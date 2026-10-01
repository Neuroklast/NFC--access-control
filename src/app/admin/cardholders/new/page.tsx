import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CardholderForm } from "@/components/admin/cardholder-form";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

export default async function NewCardholderPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader email={session.email} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-2xl font-semibold">Karte anlegen</h1>
          <Button variant="outline" render={<Link href="/admin/cardholders" />}>
            Zurück
          </Button>
        </div>
        <CardholderForm />
      </main>
    </div>
  );
}
