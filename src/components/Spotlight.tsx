import Link from "next/link";
import Image from "next/image";
import type { Spotlight as SpotlightRecord } from "@/payload-types";

export function Spotlight({ item, preview = false, homepage = false }: {
  item: SpotlightRecord; preview?: boolean; homepage?: boolean;
}) {
  const recap = typeof item.recap === "object" && item.recap?._status === "published" && !item.recap.archived ? item.recap : null;
  return <section className="community-spotlight" aria-labelledby={`spotlight-${item.id}`}>
    <div className="wrap section">
      <header className="spotlight-heading">
        <p className="eyebrow">NEIGHBORS &amp; COMMUNITY PARTNERS</p>
        {homepage ? <h2 id={`spotlight-${item.id}`}>Community Spotlight</h2> : <h1 id={`spotlight-${item.id}`}>{item.title}</h1>}
        {homepage ? <h3 className="spotlight-title">{item.title}</h3> : null}
        <p className="lead">{item.introduction}</p>
        {item.meetingDate ? <p className="spotlight-date">Recognizing our <time dateTime={item.meetingDate}>{new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(item.meetingDate))}</time> gathering</p> : null}
      </header>
      <div className="recognitions">
        {(item.recognitions ?? []).map((entry, index) => {
          const photo = typeof entry.photo === "object" && entry.photo?.url && entry.photo.mimeType?.startsWith("image/") && (preview || entry.photo.visibility === "public") ? entry.photo : null;
          return <article className="recognition" key={entry.id ?? index}>
            {photo?.url ? <Image className="recognition-photo" src={photo.url.replace(/^https:\/\/(?:wyndhamparkhoa\.vercel\.app|(?:www\.)?wyndhamparkhoa\.org)(?=\/api\/media\/)/, "")} alt={photo.alt ?? ""} width={120} height={120} unoptimized /> : null}
            <div><h3>{entry.name}</h3><p className="recognition-role">{entry.role}</p><p className="recognition-message">{entry.message}</p></div>
          </article>;
        })}
      </div>
      <div className="actions spotlight-actions">
        {recap ? <Link className="button" href={`/news/${recap.slug}`}>{item.recapLabel || "Read the meeting recap"}<span aria-hidden="true">→</span></Link> : null}
        <Link className="text-link" href="/spotlight">Browse community recognition <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  </section>;
}
