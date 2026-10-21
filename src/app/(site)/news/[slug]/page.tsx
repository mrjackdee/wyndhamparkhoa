import { notFound } from "next/navigation";
import Link from "next/link";
import { news, spotlights } from "@/lib/content";
import { NewsArticle } from "@/components/NewsArticle";
import { JsonLd } from "@/components/JsonLd";
import { canonicalUrl, organization, pageMetadata } from "@/lib/seo";
import type { News } from "@/payload-types";

function publicImages(story: News) {
  return (story.photos ?? []).flatMap(({ photo }) => {
    if (typeof photo !== "object" || !photo?.url || photo.visibility !== "public" || !photo.mimeType?.startsWith("image/")) return [];
    const path = photo.url.replace(/^https:\/\/(?:wyndhamparkhoa\.vercel\.app|(?:www\.)?wyndhamparkhoa\.org)(?=\/api\/media\/)/, "");
    return [{ url: canonicalUrl(path), alt: photo.alt ?? "", width: photo.width ?? undefined, height: photo.height ?? undefined }];
  });
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = (await news()).find((n) => n.slug === slug);
  if (!story) return { title: "Not found", robots: { index: false } };
  const meta = pageMetadata(story.title, story.summary, "/news/" + slug);
  const images = publicImages(story);
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: story.createdAt,
    modifiedTime: story.updatedAt, ...(images.length ? { images } : {}) },
    twitter: { ...meta.twitter, ...(images.length ? { images: [images[0].url] } : {}) } };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = (await news()).find((n) => n.slug === slug);
  if (!story) notFound();
  const recognition = (await spotlights()).filter(item => (typeof item.recap === "object" ? item.recap?.id : item.recap) === story.id);
  const url = canonicalUrl("/news/" + slug);
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@graph": [organization, {
      "@type": "Article", "@id": url + "#article", mainEntityOfPage: url, url,
      headline: story.title, description: story.summary, articleBody: story.body,
      datePublished: story.createdAt, dateModified: story.updatedAt, inLanguage: "en-US",
      author: { "@id": organization["@id"] }, publisher: { "@id": organization["@id"] },
      image: publicImages(story).map((image) => image.url),
    }, { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl("/") },
      { "@type": "ListItem", position: 2, name: "News & Events", item: canonicalUrl("/news") },
      { "@type": "ListItem", position: 3, name: story.title, item: url },
    ] }] }} />
    <div className="wrap narrow"><p><Link href="/">Home</Link> / <Link href="/news">News &amp; Events</Link> / {story.title}</p></div>
    <NewsArticle story={story} />
    {recognition.length ? <aside className="wrap section narrow"><p className="eyebrow">COMMUNITY SPOTLIGHT</p><h2>Recognizing our neighbors and partners</h2>{recognition.map(item => <p key={item.id}><Link className="text-link" href={`/spotlight/${item.id}`}>{item.title} →</Link></p>)}</aside> : null}
  </>;
}
