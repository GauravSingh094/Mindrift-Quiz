import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mindrift - Gamified Enterprise Learning & Competition Platform",
    short_name: "Mindrift",
    description: "Enterprise Quiz, Competition, and AI Learning platform.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#a855f7",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
