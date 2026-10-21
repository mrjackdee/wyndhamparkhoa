import { ValidationError, type CollectionConfig, type Where } from "payload";
import { admin, residentManager } from "../lib/access";

export const Spotlights: CollectionConfig = {
  slug: "spotlights",
  labels: { singular: "Community Spotlight", plural: "Community Spotlight" },
  admin: {
    group: "Website", useAsTitle: "title",
    defaultColumns: ["title", "_status", "featured", "archived", "meetingDate"],
    description: "Recognize neighbors and community partners. Add entries and drag to reorder. Save Draft, Preview, then Publish changes. The most recently published featured Spotlight appears on the homepage; earlier published entries remain in the archive.",
    preview: (doc) => `/preview/spotlights/${doc.id}`,
  },
  access: {
    create: residentManager, update: residentManager, delete: admin, readVersions: residentManager,
    read: async ({ req }) => await residentManager({ req }) ? true : ({ _status: { equals: "published" } } as Where),
  },
  versions: { drafts: { autosave: false }, maxPerDoc: 30 },
  fields: [
    { name: "title", type: "text", required: true, maxLength: 120 },
    { name: "introduction", type: "textarea", required: true, maxLength: 600 },
    { name: "meetingDate", label: "Related meeting date", type: "date", admin: { date: { pickerAppearance: "dayOnly", displayFormat: "MMMM d, yyyy" }, description: "Optional. The date of the gathering being recognized." } },
    { name: "recap", label: "Related meeting recap", type: "relationship", relationTo: "news", admin: { description: "Optional. Visitors see a link only when the selected recap is published and not archived." } },
    { name: "recapLabel", label: "Recap button text", type: "text", defaultValue: "Read the meeting recap", maxLength: 80 },
    { name: "recognitions", label: "People and groups to recognize", type: "array", required: true, minRows: 1, maxRows: 30,
      labels: { singular: "Recognition", plural: "Recognitions" },
      admin: { description: "Each entry receives equal visual emphasis. Drag entries to set their order. Photos are optional." },
      fields: [
        { name: "name", label: "Person or group name", type: "text", required: true, maxLength: 180 },
        { name: "role", label: "Role or contribution", type: "text", required: true, maxLength: 120 },
        { name: "message", label: "Recognition message", type: "textarea", required: true, maxLength: 600 },
        { name: "photo", label: "Optional photo", type: "upload", relationTo: "media", filterOptions: { category: { equals: "photo" } } },
      ] },
    { name: "photosApproved", label: "Selected photos are approved for public display", type: "checkbox", defaultValue: false,
      admin: { description: "Leave new uploads private. Publishing with this confirmation makes the selected photos public.", condition: (data) => Boolean(data.recognitions?.some((r: { photo?: unknown }) => r.photo)) } },
    { name: "source", label: "Source of this recognition", type: "textarea", required: true, admin: { description: "Record who supplied the information and when. This field is for the board's reference.", }, access: { read: async ({ req }) => Boolean(await residentManager({ req })) } },
    { name: "featured", label: "Feature on homepage", type: "checkbox", defaultValue: false, admin: { position: "sidebar", description: "Publish with this selected to make this the homepage Spotlight. Only the most recently published featured Spotlight is shown." } },
    { name: "archived", label: "Move to Spotlight archive", type: "checkbox", defaultValue: false, admin: { position: "sidebar", description: "Removes this Spotlight from homepage eligibility. Published recognition remains readable in the archive. To remove it from public view entirely, unpublish it." } },
    { name: "featuredAt", type: "date", admin: { hidden: true }, access: { update: () => false } },
  ],
  hooks: {
    beforeChange: [async ({ data, originalDoc, req }) => {
      if (data._status !== "published") return data;
      if (data.featured ?? originalDoc?.featured) data.featuredAt = new Date().toISOString();
      const entries = data.recognitions ?? originalDoc?.recognitions ?? [];
      const photos = entries.filter((entry: { photo?: unknown }) => entry.photo);
      if (photos.length && !(data.photosApproved ?? originalDoc?.photosApproved))
        throw new ValidationError({ errors: [{ path: "photosApproved", message: "Confirm approval before publishing these photos." }] });
      for (const entry of photos) {
        const photo = await req.payload.findByID({ collection: "media", id: typeof entry.photo === "object" ? entry.photo.id : entry.photo, req, overrideAccess: false });
        if (photo.category !== "photo" || !photo.mimeType?.startsWith("image/") || !photo.alt?.trim() || !photo.source?.trim())
          throw new ValidationError({ errors: [{ path: "recognitions", message: "Each photo needs an image, an accessibility description, and its source." }] });
        if (photo.visibility !== "public") await req.payload.update({ collection: "media", id: photo.id, data: { visibility: "public" }, req, overrideAccess: false });
      }
      return data;
    }],
    afterChange: [async ({ req, doc, operation }) => {
      if (!req.context.skipAudit) await req.payload.create({ collection: "audit", overrideAccess: true, req,
        data: { actor: String(req.user?.id ?? "system"), action: operation, entity: "spotlights", recordID: String(doc.id) } });
      return doc;
    }],
  },
};
