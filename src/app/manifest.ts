import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Physio Vision",
    short_name: "PhysioVision",
    description:
      "Organize clinic and private physiotherapy patients, notes, and reception.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Older clients that ignore standalone still get a usable fullscreen-ish UI.
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "any",
    background_color: "#134e4a",
    theme_color: "#134e4a",
    lang: "en",
    prefer_related_applications: false,
    categories: ["medical", "productivity", "health"],
    icons: [
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
