import { canonicalUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      process.env.VERCEL_ENV === "production"
        ? {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/api", "/preview"],
          }
        : { userAgent: "*", disallow: "/" },
    sitemap: canonicalUrl("/sitemap.xml"),
  };
}
