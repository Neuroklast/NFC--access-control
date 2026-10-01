import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/login-form";
import { BRAND } from "@/lib/brand";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const from = params.from && params.from.startsWith("/admin") ? params.from : "/admin/cardholders";

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Image
            src="/brand/frc-logo-light.png"
            alt={BRAND.club}
            width={100}
            height={64}
            priority
            className="mb-2"
          />
          <CardTitle>Administration</CardTitle>
          <CardDescription>Bitte anmelden, um Karten zu verwalten.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm from={from} />
        </CardContent>
      </Card>
    </div>
  );
}
