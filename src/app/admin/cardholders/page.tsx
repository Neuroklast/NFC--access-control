import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CardholderList } from "@/components/admin/cardholder-list";
import { getSession } from "@/lib/auth/session";
import { serializeCardholder } from "@/lib/cardholders/schema";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CardholdersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const rows = await getStore().listCardholders();

  return (
    <div className="flex min-h-full flex-col">
      <AdminHeader email={session.email} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="font-heading text-2xl font-semibold">Karten</h1>
        <CardholderList items={rows.map(serializeCardholder)} />
      </main>
    </div>
  );
}
