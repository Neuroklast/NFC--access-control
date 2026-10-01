"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LockIcon, PlusIcon, SearchIcon, UnlockIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type CardholderRow = {
  id: string;
  card_uid: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  has_photo: boolean;
};

function Photo({ row, size }: { row: CardholderRow; size: number }) {
  if (!row.has_photo) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        —
      </div>
    );
  }
  return (
    <Image
      src={`/api/v1/cardholders/${row.id}/photo`}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-lg object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export function CardholderList({ items }: { items: CardholderRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((row) =>
      `${row.first_name} ${row.last_name} ${row.card_uid} ${row.role}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  async function toggleActive(row: CardholderRow) {
    setPendingId(row.id);
    try {
      const response = await fetch(`/api/v1/cardholders/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !row.is_active }),
      });
      if (response.ok) {
        toast.success(row.is_active ? "Karte gesperrt" : "Karte aktiviert");
        router.refresh();
        return;
      }
      toast.error("Ändern fehlgeschlagen");
    } catch {
      toast.error("Keine Verbindung");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name oder UID"
            aria-label="Karten durchsuchen"
            className="pl-8"
          />
        </div>
        <Button render={<Link href="/admin/cardholders/new" />} className="min-h-11">
          <PlusIcon data-icon="inline-start" />
          Karte anlegen
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Keine Karten</EmptyTitle>
            <EmptyDescription>
              {items.length === 0
                ? "Noch keine Karten erfasst."
                : "Keine Treffer für diese Suche."}
            </EmptyDescription>
          </EmptyHeader>
          {items.length === 0 ? (
            <EmptyContent>
              <Button render={<Link href="/admin/cardholders/new" />}>Karte anlegen</Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Photo row={row} size={40} />
                    </TableCell>
                    <TableCell>
                      {row.first_name} {row.last_name}
                    </TableCell>
                    <TableCell className="font-mono">{row.card_uid}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>
                      <Badge variant={row.is_active ? "secondary" : "destructive"}>
                        {row.is_active ? "Aktiv" : "Gesperrt"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant={row.is_active ? "outline" : "default"}
                          size="sm"
                          disabled={pendingId === row.id}
                          onClick={() => void toggleActive(row)}
                        >
                          {row.is_active ? (
                            <LockIcon data-icon="inline-start" />
                          ) : (
                            <UnlockIcon data-icon="inline-start" />
                          )}
                          {row.is_active ? "Sperren" : "Aktivieren"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/admin/cardholders/${row.id}`} />}
                        >
                          Bearbeiten
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <div className="flex items-start gap-3">
                  <Photo row={row} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {row.first_name} {row.last_name}
                    </p>
                    <p className="font-mono text-sm text-muted-foreground">{row.card_uid}</p>
                    <p className="text-sm text-muted-foreground">{row.role}</p>
                  </div>
                  <Badge variant={row.is_active ? "secondary" : "destructive"}>
                    {row.is_active ? "Aktiv" : "Gesperrt"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant={row.is_active ? "outline" : "default"}
                    disabled={pendingId === row.id}
                    onClick={() => void toggleActive(row)}
                  >
                    {row.is_active ? "Sperren" : "Aktivieren"}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    render={<Link href={`/admin/cardholders/${row.id}`} />}
                  >
                    Bearbeiten
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
