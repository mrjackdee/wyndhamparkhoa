import { randomUUID } from "node:crypto";
import { ValidationError } from "payload";
import type {
  CollectionConfig,
  CollectionAfterChangeHook,
  Field,
} from "payload";
import {
  admin,
  residentManager,
  staff,
  published,
  publicMedia,
  nobody,
  role,
} from "../lib/access";
const text = (name: string, required = false): Field => ({
  name,
  type: "text",
  required,
});
const audit: CollectionAfterChangeHook = async ({
  req,
  doc,
  collection,
  operation,
}) => {
  if (req.context.skipAudit) return doc;
  await req.payload.create({
    collection: "audit",
    overrideAccess: true,
    req,
    data: {
      actor: String(req.user?.id ?? "system"),
      action: operation,
      entity: collection.slug,
      recordID: String(doc.id),
    },
  });
  return doc;
};
const managed = {
  create: staff,
  read: published,
  update: staff,
  delete: admin,
  readVersions: staff,
};
const versions = { drafts: { autosave: false }, maxPerDoc: 30 };
const archive: Field = {
  name: "archived",
  type: "checkbox",
  defaultValue: false,
  admin: {
    position: "sidebar",
    description:
      "Archived content is removed from public pages. Previous versions remain available.",
  },
};
const provenance: Field = {
  name: "source",
  type: "textarea",
  required: true,
  admin: {
    description:
      "Record the source and its year. Never publish unverified neighborhood claims.",
  },
};
const common: Field[] = [
  text("title", true),
  {
    name: "slug",
    type: "text",
    label: "Page address (slug)",
    admin: {
      description:
        "The final part of the page link. Example: sample-news-announcement. Use lowercase words separated by hyphens; avoid changing this after publication.",
    },
    required: true,
    unique: true,
    validate: (v: unknown) =>
      (typeof v === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) ||
      "Use lowercase words separated by hyphens.",
  },
  { name: "summary", type: "textarea", required: true },
  {
    name: "body",
    type: "textarea",
    required: true,
    admin: {
      description:
        "Plain text. Separate paragraphs with a blank line. HTML is not rendered.",
    },
  },
  provenance,
  archive,
];
const person: Field[] = [
  text("name", true),
  text("role", true),
  text("phone", true),
  { name: "sourceYear", type: "number", required: true, min: 2000, max: 2100 },
];
const preferences: Field[] = [
  { name: "textGroup", type: "select", required: true, options: ["yes", "no"] },
  {
    name: "facebookGroup",
    type: "select",
    required: true,
    options: ["yes", "no"],
  },
];
const contact: Field[] = [
  text("name", true),
  text("spouseName"),
  text("address", true),
  text("mobile"),
  { name: "email", type: "email", required: true },
  ...preferences,
];
export const Users: CollectionConfig = {
  slug: "users",
  admin: { useAsTitle: "email", group: "Access" },
  auth: {
    tokenExpiration: 3600,
    maxLoginAttempts: 5,
    lockTime: 600000,
    cookies: {
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "production",
    },
    useSessions: true,
  },
  access: {
    create: admin,
    read: async ({ req }) =>
      (await role(req)) === "administrator"
        ? true
        : req.user
          ? { id: { equals: req.user.id } }
          : false,
    update: admin,
    delete: admin,
    admin: async ({ req }) => Boolean(await role(req)),
  },
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [{ label: "Administrator", value: "administrator" }, { label: "Board Member", value: "board" }, { label: "Content Editor", value: "editor" }],
      saveToJWT: true,
    },
    { name: "active", type: "checkbox", defaultValue: true, saveToJWT: true },
    text("name"),
  ],
  hooks: {
    beforeLogin: [
      async ({ user }) => {
        if (!user.active)
          throw new Error(
            "Access unavailable. Contact your site administrator.",
          );
        return user;
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        if (operation === "create" && !data.password)
          data.password = randomUUID() + randomUUID();
        if (
          originalDoc?.role === "administrator" &&
          originalDoc.active &&
          ((data.role && data.role !== "administrator") || data.active === false)
        ) {
          const count = await req.payload.count({
            collection: "users",
            where: {
              and: [
                { role: { equals: "administrator" } },
                { active: { equals: true } },
              ],
            },
            req,
          });
          if (count.totalDocs <= 1)
            throw new Error("Invite and activate another administrator first.");
        }
        return data;
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const user = await req.payload.findByID({
          collection: "users",
          id,
          req,
          overrideAccess: true,
        });
        if (user.role === "administrator" && user.active) {
          const count = await req.payload.count({
            collection: "users",
            where: {
              and: [
                { role: { equals: "administrator" } },
                { active: { equals: true } },
              ],
            },
            req,
          });
          if (count.totalDocs <= 1)
            throw new Error("Keep at least one active administrator.");
        }
      },
    ],
    afterChange: [audit],
  },
};
export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    group: "Website",
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SITE_URL}/preview/pages/${doc.id}`,
  },
  access: managed,
  versions,
  fields: common,
  hooks: { afterChange: [audit] },
};
export const News: CollectionConfig = {
  slug: "news",
  labels: { singular: "Announcement or event", plural: "News and events" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "featured", "eventDate"],
    group: "Website",
    description: "Add photos and captions, save a draft, open Preview, then Publish changes. The first photo is the cover; drag rows to reorder. Publishing approved photos makes them public.",
    preview: (doc) =>
      `/preview/news/${doc.id}`,
  },
  access: managed,
  versions,
  fields: [
    ...common.map((field): Field => {
      if (field.type === "text" && field.name === "slug") return { ...field, admin: { ...field.admin, hidden: true } };
      if (field.type === "textarea" && field.name === "source") return { ...field, label: "Where did this news come from?", admin: { description: "For example: HOA meeting, October 17, 2026; caption supplied by DKPD." } };
      return field;
    }),
    {
      name: "photos", type: "array", label: "Photos and captions",
      labels: { singular: "Photo", plural: "Photos" }, maxRows: 20,
      admin: { description: "Add a photo, then enter its caption. Move a row to the top to use it as the cover. Keep new uploads private until this story is published." },
      fields: [
        { name: "photo", label: "Photo", type: "upload", relationTo: "media", required: true,
          filterOptions: { category: { equals: "photo" } } },
        { name: "caption", label: "Caption", type: "textarea",
          admin: { description: "Optional text shown beneath this photo. Describe the scene without identifying attendees." } },
      ],
    },
    { name: "photosApproved", label: "These photos are approved for the public website",
      type: "checkbox", defaultValue: false,
      admin: { description: "Required before publishing photos. Draft uploads stay private; Publish changes makes the selected photos publicly accessible.",
        condition: (data) => Boolean(data.photos?.length) } },
    { name: "featured", label: "Feature on homepage", type: "checkbox", defaultValue: false,
      admin: { position: "sidebar", description: "Show this story above the other news and event rows." } },
    { name: "linkLabel", label: "Homepage button text", type: "text", defaultValue: "Read the story & view photos",
      admin: { condition: (data) => Boolean(data.featured) } },
    {
      name: "kind",
      type: "select",
      required: true,
      options: ["announcement", "event"],
      defaultValue: "announcement",
    },
    {
      name: "eventDate",
      type: "date",
      admin: { date: { pickerAppearance: "dayAndTime" } },
    },
    {
      name: "endDate",
      type: "date",
      admin: { date: { pickerAppearance: "dayAndTime" } },
    },
    { name: "timezone", label: "Event timezone", type: "text", defaultValue: "America/New_York",
      admin: { position: "sidebar", description: "Defaults to local Eastern time. Usually no change is needed." } },
    { name: "location", type: "text" },
    { name: "cancelled", type: "checkbox", defaultValue: false },
  ],
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (data && !data.slug) data.slug = originalDoc?.slug || String(data.title ?? "")
          .toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (data?.kind === "event" && (!data.eventDate || !data.location))
          throw new Error("Events need a date, time, and location.");
        if (data?.timezone) {
          try {
            new Intl.DateTimeFormat("en-US", { timeZone: data.timezone });
          } catch {
            throw new Error("Enter an IANA timezone such as America/New_York.");
          }
        }
        return data;
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        if (data._status !== "published") return data;
        const photos = data.photos ?? originalDoc?.photos ?? [];
        if (photos.length && !(data.photosApproved ?? originalDoc?.photosApproved))
          throw new ValidationError({ errors: [{ path: "photosApproved",
            message: "Confirm that these photos are approved for the public website before publishing." }] });
        for (const row of photos) {
          const photo = await req.payload.findByID({ collection: "media",
            id: typeof row.photo === "object" ? row.photo.id : row.photo,
            overrideAccess: false, req });
          if (photo.category !== "photo" || !photo.mimeType?.startsWith("image/") || !photo.alt?.trim() || !photo.source?.trim())
            throw new ValidationError({ errors: [{ path: "photos",
              message: "Each photo needs an image, a description for accessibility, and its source." }] });
          if (photo.visibility !== "public") await req.payload.update({ collection: "media", id: photo.id,
            data: { visibility: "public" }, overrideAccess: false, req });
        }
        return data;
      },
    ],
    afterChange: [audit],
  },
};
export const Dues: CollectionConfig = {
  slug: "dues",
  admin: { useAsTitle: "year", group: "Website" },
  access: { ...managed, create: admin, update: admin },
  versions,
  fields: [
    {
      name: "year",
      type: "number",
      required: true,
      unique: true,
      min: 2000,
      max: 2100,
    },
    { name: "amount", type: "number", required: true, min: 0 },
    { name: "purpose", type: "textarea", required: true },
    { name: "paymentEmail", type: "email", required: true },
    { name: "instructions", type: "textarea", required: true },
    {
      name: "contacts",
      type: "array",
      required: true,
      minRows: 1,
      fields: person,
    },
    provenance,
    archive,
  ],
  hooks: { afterChange: [audit] },
};
export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "title",
    group: "Website",
    description:
      "Uploads are private until explicitly marked public. Publish only approved public documents and photos.",
  },
  access: { create: staff, read: publicMedia, update: staff, delete: admin },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    filesRequiredOnCreate: true,
    disableLocalStorage: Boolean(process.env.S3_BUCKET),
  },
  fields: [
    { name: "title", type: "text", label: "Photo or document name", required: true, defaultValue: "Community photo",
      admin: { description: "A name is filled in for you. Change it if helpful." } },
    { name: "alt", type: "text", label: "Describe the photo for accessibility",
      admin: { description: "Briefly describe what is visible. Do not identify attendees." } },
    {
      name: "visibility",
      type: "select",
      defaultValue: "private",
      required: true,
      options: ["private", "public"],
      admin: { position: "sidebar", description: "Leave private for a news draft. Publishing an approved story makes its selected photos public." },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: ["photo", "document"],
      defaultValue: "photo",
      admin: { position: "sidebar" },
    },
    { ...provenance, label: "Photo or document source",
      admin: { description: "Who supplied it and when? For example: HOA meeting photos supplied by the board, October 2026." } } as Field,
  ],
  hooks: {
    beforeValidate: [
      ({ req, data }) => {
        if (data && !data.title?.trim() && req.file) data.title = req.file.name;
        if (req.file) {
          if (req.file.size > 3 * 1024 * 1024)
            throw new Error("Maximum file size is 3 MB.");
          const b = req.file.data;
          const valid =
            (req.file.mimetype === "application/pdf" &&
              b.subarray(0, 5).toString() === "%PDF-") ||
            (req.file.mimetype === "image/png" &&
              b.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") ||
            (req.file.mimetype === "image/jpeg" &&
              b[0] === 255 &&
              b[1] === 216 &&
              b[2] === 255) ||
            (req.file.mimetype === "image/webp" &&
              b.subarray(0, 4).toString() === "RIFF" &&
              b.subarray(8, 12).toString() === "WEBP");
          if (!valid) throw new Error("File content does not match its type.");
          req.file.name =
            randomUUID() +
            "." +
            ({
              "image/png": "png",
              "image/jpeg": "jpg",
              "image/webp": "webp",
              "application/pdf": "pdf",
            }[req.file.mimetype] ?? "bin");
        }
        if (data?.category === "photo" && !data.alt)
          throw new ValidationError({ errors: [{ path: "alt", message: "Add a brief description of the photo for accessibility." }] });
        return data;
      },
    ],
    afterChange: [audit],
  },
};
export const Residents: CollectionConfig = {
  slug: "residents",
  admin: {
    useAsTitle: "name",
    group: "Private records",
    defaultColumns: ["name", "address", "mobile", "email", "signedUpAt", "status"],
    listSearchableFields: ["name", "address", "email"],
    components: { beforeList: ["@/components/AdminTools#ResidentTools"] },
  },
  access: {
    create: residentManager,
    read: residentManager,
    update: residentManager,
    delete: admin,
    readVersions: residentManager,
  },
  fields: [
    ...contact,
    { name: "signedUpAt", label: "Website signup date", type: "date", admin: { readOnly: true, description: "Original website submission date. Blank for manually added records without a linked signup." }, access: { update: () => false } },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: ["active", "archived"],
    },
    { name: "notes", type: "textarea" },
    {
      name: "preferenceHistory",
      type: "array",
      access: { update: () => false },
      admin: { readOnly: true },
      fields: [
        ...preferences,
        { name: "changedAt", type: "date", required: true },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (
          !originalDoc ||
          (data.textGroup !== undefined &&
            data.textGroup !== originalDoc.textGroup) ||
          (data.facebookGroup !== undefined &&
            data.facebookGroup !== originalDoc.facebookGroup)
        )
          data.preferenceHistory = [
            ...(originalDoc?.preferenceHistory ?? []),
            {
              textGroup: data.textGroup ?? originalDoc?.textGroup,
              facebookGroup: data.facebookGroup ?? originalDoc?.facebookGroup,
              changedAt: new Date().toISOString(),
            },
          ];
        return data;
      },
    ],
    afterChange: [audit],
  },
};
export const Submissions: CollectionConfig = {
  slug: "submissions",
  admin: {
    useAsTitle: "name",
    group: "Private records",
    defaultColumns: ["name", "requestType", "status", "createdAt"],
    listSearchableFields: ["name", "address", "email"],
    components: { beforeList: ["@/components/AdminTools#ReviewTools"] },
  },
  access: { create: nobody, read: residentManager, update: residentManager, delete: admin },
  fields: [
    {
      name: "reviewSubmission",
      type: "ui",
      admin: {
        components: { Field: "@/components/AdminTools#SubmissionReview" },
      },
    },
    ...contact.map((f) => ({ ...f, access: { update: () => false } }) as Field),
    {
      name: "requestType",
      type: "select",
      options: ["new", "update"],
      required: true,
      access: { update: () => false },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      options: ["pending", "reviewed", "archived"],
      access: { update: () => false },
    },
    { name: "notes", type: "textarea" },
    {
      name: "resident",
      type: "relationship",
      relationTo: "residents",
      access: { update: () => false },
    },
    {
      name: "idempotencyKey",
      type: "text",
      unique: true,
      required: true,
      admin: { hidden: true },
      access: { read: () => false, update: () => false },
    },
    {
      name: "privacyAcceptedAt",
      type: "date",
      required: true,
      access: { update: () => false },
    },
    {
      name: "notification",
      type: "select",
      defaultValue: "pending",
      options: ["pending", "sent", "failed"],
      access: { update: () => false },
    },
    {
      name: "notificationAttempts",
      type: "number",
      defaultValue: 0,
      access: { update: () => false },
    },
    {
      name: "notificationLastAttempt",
      type: "date",
      access: { update: () => false },
    },
  ],
  hooks: { afterChange: [audit] },
};
export const ReviewClaims: CollectionConfig = {
  slug: "review-claims",
  admin: { hidden: true },
  access: { create: nobody, read: nobody, update: nobody, delete: nobody },
  fields: [
    { name: "submissionID", type: "text", unique: true, required: true },
  ],
};
export const RateLimits: CollectionConfig = {
  slug: "rate-limits",
  admin: { hidden: true },
  access: { create: nobody, read: nobody, update: nobody, delete: nobody },
  fields: [
    { name: "key", type: "text", required: true, unique: true },
    { name: "expiresAt", type: "date", required: true },
  ],
};
export const Audit: CollectionConfig = {
  slug: "audit",
  admin: {
    group: "Access",
    defaultColumns: ["createdAt", "actor", "action", "entity", "recordID"],
    description:
      "Records actions and record IDs, without copying resident personal information.",
  },
  access: { create: nobody, read: admin, update: nobody, delete: nobody },
  fields: [
    text("actor", true),
    text("action", true),
    text("entity", true),
    text("recordID", true),
  ],
};
