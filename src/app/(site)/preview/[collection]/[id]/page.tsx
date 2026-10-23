import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createLocalReq } from "payload";
import { cms } from "@/lib/content";
import { can } from "@/lib/access";
import { Prose } from "@/components/Content";
import { NewsArticle } from "@/components/NewsArticle";
import { Spotlight } from "@/components/Spotlight";
import type { News, Spotlight as SpotlightRecord } from "@/payload-types";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private preview",
  robots: { index: false, follow: false },
};
export default async function Preview({
  params,
}: {
  params: Promise<{ collection: string; id: string }>;
}) {
  const { collection, id } = await params;
  if (collection !== "pages" && collection !== "news" && collection !== "spotlights") notFound();
  const p = await cms();
  const { user } = await p.auth({ headers: await headers() });
  const req = await createLocalReq({ user: user ?? undefined }, p);
  if (!await can(req, collection === "spotlights" ? "spotlight.manage" : "content.manage")) notFound();
  const doc = await p.findByID({
    collection,
    id,
    draft: true,
    overrideAccess: false,
    req,
    depth: 1,
  });
  return (
    <div className="wrap section">
      <p className="notice">
        Private draft preview. This content is not necessarily published.
      </p>
      {collection === "spotlights" ? <Spotlight item={doc as SpotlightRecord} preview homepage /> : collection === "news" ? <NewsArticle story={doc as News} preview /> : <>
      <h1>{doc.title}</h1>
      <p className="lead">{"summary" in doc ? doc.summary : ""}</p>
      <Prose text={"body" in doc ? doc.body : ""} />
      </>}
    </div>
  );
}
