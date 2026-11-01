import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Physio Vision",
    short_name: "PhysioVision",
    description:
      "Organize clinic and private physiotherapy patients, notes, and reception.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#134e4a",
    theme_color: "#134e4a",
    categories: ["medical", "productivity", "health"],
    icons: [
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
