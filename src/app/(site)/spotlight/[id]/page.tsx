import { notFound } from "next/navigation";
import { cms } from "@/lib/content";
import { Spotlight } from "@/components/Spotlight";
import { pageMetadata } from "@/lib/seo";
import { cache } from "react";
const read = cache(async (id: string) => {
  if (!/^\d+$/.test(id)) return null;
  const p = await cms();
  return (await p.find({ collection: "spotlights", where: { id: { equals: Number(id) } }, limit: 1, depth: 1, overrideAccess: false })).docs[0];
});
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const item = await read(id);
  return item ? pageMetadata(item.title, item.introduction, `/spotlight/${id}`) : { title: "Not found", robots: { index: false } };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const item = await read((await params).id);
  if (!item) notFound();
  return <Spotlight item={item} />;
}
