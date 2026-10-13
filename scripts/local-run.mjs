// Synthetic local setup only. Never deploy this environment.
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
if (process.env.VERCEL) throw new Error("Local setup is disabled on Vercel");
const file = ".env.local";
if (!fs.existsSync(file))
  fs.writeFileSync(
    file,
    `LOCAL_TEST_MODE=true\nPAYLOAD_SECRET=${randomBytes(32).toString("hex")}\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\nBOOTSTRAP_ADMIN_EMAIL=qa-admin@example.invalid\nBOOTSTRAP_ADMIN_PASSWORD=${randomBytes(24).toString("base64url")}\n`,
    { mode: 0o600 },
  );
for (const line of fs.readFileSync(file, "utf8").trim().split("\n")) {
  const i = line.indexOf("=");
  process.env[line.slice(0, i)] = line.slice(i + 1);
}
const command = process.argv[2] ?? "seed";
const result = spawnSync("npm", ["run", command], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
