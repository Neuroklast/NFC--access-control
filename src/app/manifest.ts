import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.club} — ${BRAND.app}`,
    short_name: BRAND.shortName,
    description: "Ausweisprüfung für Club-Mitarbeiter",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND.themeColor,
    theme_color: BRAND.themeColor,
    lang: "de",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
