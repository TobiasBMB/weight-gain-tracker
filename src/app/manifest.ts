import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nourish",
    short_name: "Nourish",
    description: "A private tracker and plan for gaining healthy weight.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    background_color: "#0b1222",
    theme_color: "#0b1222",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
