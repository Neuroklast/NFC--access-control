import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { PasswordForm } from "@/components/admin/password-form";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminPasswordPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader email={session.email} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="font-heading text-2xl font-semibold">Passwort ändern</h1>
        <PasswordForm />
      </main>
    </div>
  );
}
