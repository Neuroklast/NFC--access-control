import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CardholderDelete } from "@/components/admin/cardholder-delete";
import { CardholderForm } from "@/components/admin/cardholder-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth/session";
import { getStore } from "@/lib/store";

export default async function EditCardholderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const row = await getStore().findCardholder(id);
  if (!row) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <AdminHeader email={session.email} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-2xl font-semibold">Karte bearbeiten</h1>
          <Button variant="outline" render={<Link href="/admin/cardholders" />}>
            Zurück
          </Button>
        </div>
        <CardholderForm
          id={row.id}
          hasPhoto={row.photoUpdatedAt !== null}
          initial={{
            card_uid: row.cardUid,
            first_name: row.firstName,
            last_name: row.lastName,
            role: row.role,
            is_active: row.isActive,
          }}
        />
        <Separator />
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Karte löschen</h2>
          <p className="text-sm text-muted-foreground">
            Zum Sperren genügt es, „Aktiv“ zu deaktivieren. Löschen entfernt die Karte dauerhaft.
          </p>
          <CardholderDelete
            id={row.id}
            fullName={`${row.firstName} ${row.lastName}`}
            lastName={row.lastName}
          />
        </div>
      </main>
    </div>
  );
}
