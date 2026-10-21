import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
export const cms = cache(() => getPayload({ config }));
export const settings = cache(async () => {
  const p = await cms();
  return p.findGlobal({
    slug: "site-settings",
    overrideAccess: false,
    depth: 1,
  });
});
export const pages = cache(async () => {
  const p = await cms();
  return (
    await p.find({
      collection: "pages",
      overrideAccess: false,
      depth: 0,
      limit: 30,
      sort: "title",
    })
  ).docs;
});
export const dues = cache(async () => {
  const p = await cms();
  return (
    await p.find({
      collection: "dues",
      overrideAccess: false,
      depth: 0,
      limit: 50,
      sort: "-year",
    })
  ).docs;
});
export const news = cache(async () => {
  const p = await cms();
  return (
    await p.find({
      collection: "news",
      overrideAccess: false,
      depth: 1,
      limit: 100,
      sort: "-createdAt",
    })
  ).docs;
});

export const spotlights = cache(async () => {
  const p = await cms();
  return (await p.find({ collection: "spotlights", overrideAccess: false,
    depth: 1, limit: 100, sort: ["-featuredAt", "-id"] })).docs;
});
