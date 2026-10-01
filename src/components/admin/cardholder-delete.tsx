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
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function confirmDelete() {
    const response = await fetch(`/api/v1/cardholders/${id}`, { method: "DELETE" });
    if (response.status === 204) {
      toast.success("Karte gelöscht");
      setOpen(false);
      router.push("/admin/cardholders");
      router.refresh();
      return;
    }
    toast.error("Löschen fehlgeschlagen");
  }

  const matches = confirmText.trim().toLowerCase() === lastName.trim().toLowerCase();

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Endgültig löschen
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
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
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!matches}
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
