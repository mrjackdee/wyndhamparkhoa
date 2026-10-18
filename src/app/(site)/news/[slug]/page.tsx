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
  return { title: n?.title ?? "Not found", description: n?.summary };
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
