import type { News } from "@/payload-types";
import { Prose } from "./Content";
import { NewsGallery } from "./NewsGallery";

export function NewsArticle({ story, preview = false }: { story: News; preview?: boolean }) {
  return <article className="wrap section narrow">
    <p className="eyebrow">{story.cancelled ? "CANCELLED" : story.kind.toUpperCase()}</p>
    <h1>{story.title}</h1>
    <p className="lead">{story.summary}</p>
    {story.eventDate ? <p><time dateTime={story.eventDate}>
      {new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short",
        timeZone: story.timezone ?? "America/New_York" }).format(new Date(story.eventDate))}
    </time> ({story.timezone ?? "America/New_York"})<br />{story.location}</p> : null}
    <NewsGallery photos={story.photos} preview={preview} />
    <Prose text={story.body} />
  </article>;
}
