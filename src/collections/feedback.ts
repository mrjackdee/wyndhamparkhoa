import type { CollectionConfig } from "payload";
import { del } from "@vercel/blob";
import { admin, nobody, residentManager } from "../lib/access";
import type { FeedbackAttachment } from "../lib/feedback";
const fieldDenied = () => false;
const locked = { update: fieldDenied };
export const Feedback: CollectionConfig = {
  slug: "feedback",
  labels: { singular: "Website feedback", plural: "Website feedback" },
  admin: {
    useAsTitle: "subject",
    group: "Private records",
    defaultColumns: ["subject", "name", "category", "status", "createdAt"],
    listSearchableFields: ["subject", "name", "email"],
  },
  access: {
    create: nobody,
    read: residentManager,
    update: residentManager,
    delete: admin,
  },
  fields: [
    {
      name: "reviewTools",
      type: "ui",
      admin: { components: { Field: "@/components/FeedbackReview#default" } },
    },
    { name: "name", type: "text", required: true, access: locked },
    { name: "email", type: "email", required: true, access: locked },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Website issue", value: "issue" },
        { label: "Suggested change", value: "suggestion" },
        { label: "Other feedback", value: "other" },
      ],
      access: locked,
    },
    { name: "subject", type: "text", required: true, access: locked },
    { name: "pageUrl", label: "Related page", type: "text", access: locked },
    { name: "message", type: "textarea", required: true, access: locked },
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      required: true,
      options: [
        { label: "New", value: "new" },
        { label: "Under review", value: "reviewing" },
        { label: "Resolved", value: "resolved" },
      ],
    },
    { name: "notes", label: "Internal review notes", type: "textarea" },
    {
      name: "attachments",
      type: "json",
      admin: { hidden: true },
      access: { read: fieldDenied, update: fieldDenied },
    },
    {
      name: "idempotencyKey",
      type: "text",
      required: true,
      unique: true,
      admin: { hidden: true },
      access: { read: fieldDenied, update: fieldDenied },
    },
    {
      name: "privacyAcceptedAt",
      type: "date",
      required: true,
      admin: { readOnly: true },
      access: locked,
    },
    {
      name: "notification",
      type: "select",
      options: ["pending", "sent", "failed"],
      defaultValue: "pending",
      admin: { readOnly: true },
      access: locked,
    },
    {
      name: "notificationAttempts",
      type: "number",
      defaultValue: 0,
      admin: { readOnly: true },
      access: locked,
    },
    {
      name: "notificationLastAttempt",
      type: "date",
      admin: { readOnly: true },
      access: locked,
    },
  ],
  hooks: {
    afterChange: [
      async ({ req, doc, operation }) => {
        await req.payload.create({
          collection: "audit",
          overrideAccess: true,
          req,
          data: {
            actor: String(req.user?.id ?? "public"),
            action: operation,
            entity: "feedback",
            recordID: String(doc.id),
          },
        });
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        const files = doc.attachments as FeedbackAttachment[] | null;
        if (files?.length) await del(files.map((f) => f.path));
      },
    ],
  },
};
