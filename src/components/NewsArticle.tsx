import type { News } from "@/payload-types";
import { Prose } from "./Content";
import { NewsGallery } from "./NewsGallery";

export function NewsArticle({ story, preview = false }: { story: News; preview?: boolean }) {
  return <article className="wrap section narrow news-article">
    <p className="eyebrow">{story.cancelled ? "CANCELLED" : story.kind.toUpperCase()}</p>
    <h1>{story.title}</h1>
    <p className="lead">{story.summary}</p>
    {story.eventDate ? <p><time dateTime={story.eventDate}>
      {new Intl.DateTimeFormat("en-US", { dateStyle: "full", ...(story.slug === "meeting" ? {} : { timeStyle: "short" as const }),
        timeZone: story.timezone ?? "America/New_York" }).format(new Date(story.eventDate))}
    </time>{story.slug !== "meeting" ? <> ({story.timezone ?? "America/New_York"})<br />{story.location}</> : null}</p> : null}
    {(preview || story.slug !== "meeting") && <NewsGallery photos={story.photos} preview={preview} />}
    <Prose text={story.body} />
  </article>;
}
