import { z } from "zod";
const clean = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),
      "Remove control characters.",
    );
export const signupSchema = z
  .object({
    requestType: z.enum(["new", "update"]),
    name: clean(120).min(1, "Enter your name."),
    spouseName: clean(120).default(""),
    address: clean(300).min(1, "Enter your address."),
    mobile: clean(40).default(""),
    email: z.email().trim().toLowerCase().max(254),
    textGroup: z.enum(["yes", "no"]),
    facebookGroup: z.enum(["yes", "no"]),
    privacy: z.literal(true),
    idempotencyKey: z.uuid(),
    website: z.literal(""),
    token: z.string().min(1).max(300),
  })
  .superRefine((v, ctx) => {
    if (v.textGroup === "yes" && v.mobile.replace(/\D/g, "").length < 10)
      ctx.addIssue({
        code: "custom",
        path: ["mobile"],
        message: "Enter a mobile number to request text messages.",
      });
    if (
      v.mobile &&
      (v.mobile.replace(/\D/g, "").length < 10 ||
        v.mobile.replace(/\D/g, "").length > 15)
    )
      ctx.addIssue({
        code: "custom",
        path: ["mobile"],
        message: "Enter a valid phone number.",
      });
  });
export function csvCell(value: unknown) {
  let v = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(v)) v = "'" + v;
  return '"' + v.replaceAll('"', '""') + '"';
}
