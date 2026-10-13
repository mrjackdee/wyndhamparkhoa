import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createLocalReq } from "payload";
import { cms } from "@/lib/content";
import { role } from "@/lib/access";
import { Prose } from "@/components/Content";
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
  if (collection !== "pages" && collection !== "news") notFound();
  const p = await cms();
  const { user } = await p.auth({ headers: await headers() });
  const req = await createLocalReq({ user: user ?? undefined }, p);
  if (!(await role(req))) notFound();
  const doc = await p.findByID({
    collection,
    id,
    draft: true,
    overrideAccess: false,
    req,
  });
  return (
    <div className="wrap section">
      <p className="notice">
        Private draft preview. This content is not necessarily published.
      </p>
      <h1>{doc.title}</h1>
      <p className="lead">{doc.summary}</p>
      <Prose text={doc.body} />
    </div>
  );
}
