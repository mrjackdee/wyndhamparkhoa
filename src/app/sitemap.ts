import type { MetadataRoute } from "next";
import { pages, news, spotlights } from "@/lib/content";
import { canonicalUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Public readers enforce published-only access.
  const [publishedPages, publishedNews, recognition] = await Promise.all([pages(), news(), spotlights()]);
  const routes = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const path of ["/", "/hoa-and-leadership", "/hoa-dues", "/resident-signup", "/website-feedback", "/contact", "/resources", "/privacy", "/terms", ...(publishedNews.length ? ["/news"] : [])]) {
    routes.set(path, { url: canonicalUrl(path) });
  }
  for (const page of publishedPages) {
    const path = "/" + page.slug;
    if (!routes.has(path)) routes.set(path, { url: canonicalUrl(path), lastModified: page.updatedAt });
  }
  for (const story of publishedNews) {
    const path = "/news/" + story.slug;
    routes.set(path, { url: canonicalUrl(path), lastModified: story.updatedAt });
  }
  if (recognition.length) routes.set("/spotlight", { url: canonicalUrl("/spotlight") });
  for (const item of recognition) routes.set(`/spotlight/${item.id}`, { url: canonicalUrl(`/spotlight/${item.id}`), lastModified: item.updatedAt });
  return [...routes.values()];
}
