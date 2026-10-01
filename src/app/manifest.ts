import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.club} — ${BRAND.app}`,
    short_name: BRAND.shortName,
    description: "Zugangsprüfung für Club-Mitarbeiter.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND.themeColor,
    theme_color: BRAND.themeColor,
    lang: "de",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
