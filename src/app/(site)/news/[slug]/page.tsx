import { notFound } from "next/navigation";
import { news } from "@/lib/content";
import { NewsArticle } from "@/components/NewsArticle";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const n = (await news()).find((n) => n.slug === slug);
  const title = n?.title ?? "Not found";
  const shareTitle = `${title} | Wyndham Park HOA`;
  return { title, description: n?.summary,
    openGraph: { title: shareTitle, description: n?.summary, siteName: "Wyndham Park HOA", type: "article" },
    twitter: { card: "summary", title: shareTitle, description: n?.summary },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const n = (await news()).find((n) => n.slug === slug);
  if (!n) notFound();
  return <NewsArticle story={n} />;
}
