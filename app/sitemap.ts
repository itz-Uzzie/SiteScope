import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: getSiteUrl(), lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${getSiteUrl()}/learn`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
