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
    sitemap: process.env.NEXT_PUBLIC_SITE_URL + "/sitemap.xml",
  };
}
