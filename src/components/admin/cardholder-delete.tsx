"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CardholderDelete({
  id,
  fullName,
  lastName,
}: {
  id: string;
  fullName: string;
  lastName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function confirmDelete() {
    if (!matches || pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/v1/cardholders/${id}`, { method: "DELETE" });
      if (response.status === 204) {
        toast.success("Karte gelöscht");
        setOpen(false);
        router.push("/admin/cardholders");
        router.refresh();
        return;
      }
      toast.error("Löschen fehlgeschlagen. Bitte erneut versuchen.");
    } catch {
      toast.error("Keine Verbindung zum Server. Löschen bitte erneut versuchen.");
    } finally {
      setPending(false);
    }
  }

  const matches = confirmText.trim().toLowerCase() === lastName.trim().toLowerCase();

  return (
    <>
      <Button variant="destructive" onClick={() => { setConfirmText(""); setOpen(true); }}>
        Endgültig löschen
      </Button>
      <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!pending) setOpen(nextOpen); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Karte löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Die Karte von ${fullName} wird dauerhaft entfernt. Zum Sperren genügt es, „Aktiv“ zu deaktivieren.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="confirm-name">
                {`Zum Bestätigen Nachnamen eingeben: ${lastName}`}
              </FieldLabel>
              <Input
                id="confirm-name"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoComplete="off"
              />
            </Field>
          </FieldGroup>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!matches || pending}
              onClick={() => void confirmDelete()}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
