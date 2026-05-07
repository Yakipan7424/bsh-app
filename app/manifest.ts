import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BSH Times",
    short_name: "BSH",
    description: "British Shorthair lovers app",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F6",
    theme_color: "#607D8B",
    icons: [
      {
        src: "/globe.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/next.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
