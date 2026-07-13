import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DTMonitor — Cloud & SaaS Status Monitor",
    short_name: "DTMonitor",
    description:
      "Live cloud, SaaS, DevOps, security, and internet outage monitoring.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1114",
    theme_color: "#0f1114",
    icons: [
      {
        src: "/dtlogo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
