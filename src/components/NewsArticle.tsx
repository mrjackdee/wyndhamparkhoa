import type { News } from "@/payload-types";
import { Prose } from "./Content";
import { NewsGallery } from "./NewsGallery";

export function NewsArticle({ story, preview = false }: { story: News; preview?: boolean }) {
  const video = typeof story.video === "object" && story.video?.mimeType === "video/mp4" && (preview || story.video.visibility === "public") ? story.video : null;
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
    {video?.url ? <section className="meeting-video" aria-labelledby="meeting-video-heading">
      <h2 id="meeting-video-heading">Community video</h2>
      <p>This video has no audio. Select Play to watch.</p>
      <video controls playsInline preload="metadata" aria-describedby="meeting-video-description" style={{ width: "100%", aspectRatio: "16 / 9", background: "#1d4035" }}>
        <source src={video.url.replace(/^https:\/\/(?:wyndhamparkhoa\.vercel\.app|(?:www\.)?wyndhamparkhoa\.org)(?=\/api\/media\/)/, "")} type="video/mp4" />
        Your browser does not support this video. <a href={video.url}>Download the silent video</a>.
      </video>
      <p id="meeting-video-description">{story.videoDescription}</p>
    </section> : null}
  </article>;
}
