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
import { admin, staff } from "./lib/access";
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
  csrf: [process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"],
  admin: {
    user: "users",
    meta: { titleSuffix: " | Wyndham Park HOA" },
    importMap: { baseDir: dirname },
    components: { beforeDashboard: ["@/components/AdminWelcome#default"] },
  },
  db: local
    ? sqliteAdapter({
        client: {
          url: process.env.TEST_DATABASE_URL ?? "file:./local-test.db",
        },
        push: true,
      })
    : postgresAdapter({
        pool: { connectionString: process.env.DATABASE_URL },
        schemaName: "wphoa",
        migrationDir: path.resolve(dirname, "migrations"),
        push: false,
      }),
  collections: [
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
      access: { read: () => true, update: admin, readVersions: staff },
      versions: { max: 30 },
      fields: [
        {
          name: "hero",
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
          type: "select",
          defaultValue: "center",
          options: ["center", "top", "bottom"],
        },
        {
          name: "intro",
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
            { name: "phone", type: "text", required: true },
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
