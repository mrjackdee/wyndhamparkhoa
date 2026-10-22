import { Spotlights } from "./collections/spotlights";
import { Feedback } from "./collections/feedback";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { privateBlobStorage } from "./lib/private-blob";
import { s3Storage } from "@payloadcms/storage-s3";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Users,
  Pages,
  News,
  Dues,
  Media,
  Residents,
  Submissions,
  RateLimits,
  Audit,
  ReviewClaims,
} from "./collections";
import { staff, residentManager, role } from "./lib/access";
const databaseSchema = process.env.HOA_QA_SCHEMA ?? "wphoa";
if (databaseSchema !== "wphoa" && !/^wphoa_qa_[a-f0-9]{12}$/.test(databaseSchema)) throw new Error("Invalid isolated QA schema");
const dirname = path.dirname(fileURLToPath(import.meta.url));
const local = process.env.LOCAL_TEST_MODE === "true" && !process.env.VERCEL;
if (!local && !process.env.DATABASE_URL)
  throw new Error(
    "Durable DATABASE_URL is required. Local test storage is never permitted on Vercel.",
  );
if (
  process.env.VERCEL &&
  ((!process.env.S3_BUCKET && !process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) || !process.env.PAYLOAD_SECRET)
)
  throw new Error(
    "Private durable upload storage and a signing secret are required.",
  );
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET ?? "",
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Explicit trusted origins: the public domain and the existing admin hostname.
  // Never derive this allowlist from untrusted request headers.
  csrf: Array.from(new Set([
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    "https://www.wyndhamparkhoa.org",
    "https://wyndhamparkhoa.org",
    "https://wyndhamparkhoa.vercel.app",
  ])),
  admin: {
    theme: "light",
    user: "users",
    meta: { titleSuffix: " | Wyndham Park HOA" },
    importMap: { baseDir: dirname },
    components: { beforeDashboard: ["@/components/AdminWelcome#default"] },
  },
  db: local
    ? sqliteAdapter({
        transactionOptions: {},
        client: {
          url: process.env.TEST_DATABASE_URL ?? "file:./local-test.db",
        },
        push: true,
      })
    : postgresAdapter({
        pool: { connectionString: process.env.DATABASE_URL },
        schemaName: databaseSchema,
        migrationDir: path.resolve(dirname, "migrations"),
        push: false,
      }),
  collections: [
    Spotlights,
    Feedback,
    Users,
    Pages,
    News,
    Dues,
    Media,
    Residents,
    Submissions,
    RateLimits,
    Audit,
    ReviewClaims,
  ],
  globals: [
    {
      slug: "site-settings",
      label: "Site settings",
      access: { read: () => true, update: residentManager, readVersions: staff },
      versions: { max: 30 },
      fields: [
        {
          name: "hero",
          access: { update: async ({ req }) => (await role(req)) === "administrator" },
          type: "upload",
          relationTo: "media",
          filterOptions: {
            and: [
              { category: { equals: "photo" } },
              { visibility: { equals: "public" } },
            ],
          },
        },
        {
          name: "heroPosition",
          access: { update: async ({ req }) => (await role(req)) === "administrator" },
          type: "select",
          defaultValue: "center",
          options: ["center", "top", "bottom"],
        },
        {
          name: "intro",
          access: { update: async ({ req }) => (await role(req)) === "administrator" },
          type: "textarea",
          required: true,
          defaultValue:
            "Stay connected with Wyndham Park Homeowners Association. Find annual dues information, update your contact details, and reach your HOA representatives.",
        },
        {
          name: "leadership",
          type: "array",
          fields: [
            { name: "name", type: "text", required: true },
            { name: "role", type: "text", required: true },
            { name: "phone", type: "text" },
            { name: "group", type: "text", required: true, defaultValue: "Board Members", validate: (value: unknown) => value === "Board Members" || value === "Standing Committees" || "Choose Board Members or Standing Committees", admin: { description: "Board Members or Standing Committees" } },
            { name: "sourceYear", type: "number", required: true },
          ],
        },
      ],
    },
  ],
  sharp,
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.MAIL_FROM!,
        defaultFromName: "Wyndham Park HOA",
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_PORT === "465",
          requireTLS: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        },
      })
    : () => ({
        name: "disabled",
        defaultFromAddress: "disabled@example.invalid",
        defaultFromName: "Disabled",
        sendEmail: async () => {
          throw new Error("Verified email service is not configured.");
        },
      }),
  plugins: (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) ? [privateBlobStorage()] : process.env.S3_BUCKET
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET,
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION ?? "us-east-1",
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID!,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
          },
        }),
      ]
    : [],
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  upload: { limits: { fileSize: 3 * 1024 * 1024 } },
});
