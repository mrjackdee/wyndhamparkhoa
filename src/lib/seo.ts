import type { Metadata } from "next";

// The public canonical domain is independent of preview/CMS deployment URLs.
export const SITE_URL = "https://www.wyndhamparkhoa.org";
export const SITE_NAME = "Wyndham Park HOA";
export const SITE_DESCRIPTION = "Wyndham Park Homeowners Association news, resident resources, annual dues information, and HOA contacts.";
export const canonicalUrl = (path = "/") => new URL(path, SITE_URL).href;

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const shareTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  return {
    title, description, alternates: { canonical: canonicalUrl(path) },
    openGraph: { title: shareTitle, description, url: canonicalUrl(path), siteName: SITE_NAME,
      type: "website", locale: "en_US", images: [{ url: canonicalUrl("/wyndham-park-entrance.jpeg"), alt: "Wyndham Park neighborhood entrance" }] },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [canonicalUrl("/wyndham-park-entrance.jpeg")] },
  };
}

export const organization = { "@type": "Organization", "@id": `${SITE_URL}/#organization`,
  name: "Wyndham Park Homeowners Association", alternateName: "Wyndham Park HOA", url: SITE_URL };
