import { isDemoMode } from "@/lib/store/mode";

export function DemoBanner() {
  if (!isDemoMode()) {
    return null;
  }
  return (
    <div
      role="status"
      className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black"
    >
      Demo-Modus ohne Datenbank — Daten liegen nur im Speicher und werden beim Neustart
      zurückgesetzt.
    </div>
  );
}
