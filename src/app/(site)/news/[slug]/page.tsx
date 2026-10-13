import { notFound } from "next/navigation";
import { news } from "@/lib/content";
import { Prose } from "@/components/Content";
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
  return (
    <article className="wrap section narrow">
      <p className="eyebrow">
        {n.cancelled ? "CANCELLED" : n.kind.toUpperCase()}
      </p>
      <h1>{n.title}</h1>
      <p className="lead">{n.summary}</p>
      {n.eventDate ? (
        <p>
          {new Intl.DateTimeFormat("en-US", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: n.timezone ?? "America/New_York",
          }).format(new Date(n.eventDate))}{" "}
          ({n.timezone})<br />
          {n.location}
        </p>
      ) : null}
      <Prose text={n.body} />
    </article>
  );
}
