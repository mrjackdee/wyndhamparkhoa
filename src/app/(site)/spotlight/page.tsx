import Link from "next/link";
import { spotlights } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Community Spotlight", "Recognizing Wyndham Park neighbors, volunteers, and community partners.", "/spotlight");
export default async function Page() {
  const items = await spotlights();
  return <div className="wrap section narrow"><p className="eyebrow">OUR COMMUNITY</p><h1>Community Spotlight</h1>
    <p className="lead">Recognizing the people who give their time and care to Wyndham Park.</p>
    {items.length ? <div className="spotlight-archive">{items.map(item => <article key={item.id}>
      <p className="eyebrow">{item.archived ? "FROM THE ARCHIVE" : "COMMUNITY RECOGNITION"}</p>
      <h2><Link href={`/spotlight/${item.id}`}>{item.title}</Link></h2><p>{item.introduction}</p>
      <Link className="text-link" href={`/spotlight/${item.id}`}>Meet those recognized <span aria-hidden="true">→</span></Link>
    </article>)}</div> : <p>Community recognition will appear here when published by the HOA.</p>}
  </div>;
}
