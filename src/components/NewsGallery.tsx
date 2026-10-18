import Image from "next/image";
import type { News } from "@/payload-types";

export function NewsGallery({ photos, preview = false, coverOnly = false }: {
  photos: News["photos"]; preview?: boolean; coverOnly?: boolean;
}) {
  const visible = (photos ?? []).filter(({ photo }) =>
    typeof photo === "object" && photo !== null && photo.url && photo.alt &&
    photo.mimeType?.startsWith("image/") && (preview || photo.visibility === "public"),
  );
  const items = coverOnly ? visible.slice(0, 1) : visible;
  if (!items.length) return null;
  return <div className={coverOnly ? "news-cover" : "news-gallery"} aria-label="Community photos">
    {items.map(({ photo, caption, id }, index) => {
      if (typeof photo !== "object" || !photo?.url) return null;
      return <figure key={id ?? photo.id} className={index === 0 ? "news-photo-lead" : undefined}>
        <Image src={photo.url.replace(/^https:\/\/(?:wyndhamparkhoa\.vercel\.app|(?:www\.)?wyndhamparkhoa\.org)(?=\/api\/media\/)/, "")} alt={photo.alt!} width={photo.width ?? 1125}
          height={photo.height ?? 750} unoptimized
          sizes={coverOnly ? "(max-width: 760px) 100vw, 50vw" : "(max-width: 760px) 100vw, 900px"} />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>;
    })}
  </div>;
}
