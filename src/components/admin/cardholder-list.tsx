"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
};

export function CardholderList({ items }: { items: CardholderRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CardholderRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((row) =>
      `${row.first_name} ${row.last_name} ${row.card_uid} ${row.role}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    const target = pendingDelete;
    setPendingDelete(null);
    const response = await fetch(`/api/v1/cardholders/${target.id}`, { method: "DELETE" });
    if (response.status === 204) {
      toast.success("Karte gelöscht");
      router.refresh();
      return;
    }
    toast.error("Löschen fehlgeschlagen");
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
                ? "Noch keine Karten. Erste Karte anlegen."
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
                        <Button variant="outline" size="sm" render={<Link href={`/admin/cardholders/${row.id}`} />}>
                          Bearbeiten
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          aria-label={`${row.first_name} ${row.last_name} löschen`}
                          onClick={() => setPendingDelete(row)}
                        >
                          <Trash2Icon />
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
              <div key={row.id} className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {row.first_name} {row.last_name}
                    </p>
                    <p className="font-mono text-sm text-muted-foreground">{row.card_uid}</p>
                  </div>
                  <Badge variant={row.is_active ? "secondary" : "destructive"}>
                    {row.is_active ? "Aktiv" : "Gesperrt"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{row.role}</p>
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" render={<Link href={`/admin/cardholders/${row.id}`} />}>
                    Bearbeiten
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setPendingDelete(row)}
                  >
                    Löschen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Karte löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `Karte von ${pendingDelete.first_name} ${pendingDelete.last_name} unwiderruflich löschen?`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
