import type { MetadataRoute } from "next";
import { pages, news } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [p, n] = await Promise.all([pages(), news()]);
  const routes = [
    "",
    "/hoa-dues",
    "/resident-signup",
    "/contact",
    "/resources",
    "/privacy",
    ...p.map((p) => "/" + p.slug),
    ...(n.length ? ["/news"] : []),
    ...n.map((n) => "/news/" + n.slug),
  ];
  return routes.map((route) => ({
    url: process.env.NEXT_PUBLIC_SITE_URL + route,
  }));
}
