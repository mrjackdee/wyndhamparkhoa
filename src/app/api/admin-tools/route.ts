import { approveResident } from "@/lib/resident-review";
import { getPayload, createLocalReq } from "payload";
import config from "@payload-config";
import { role, can } from "@/lib/access";
import { sameOrigin } from "@/lib/security";
import { csvCell } from "@/lib/validation";
import { notifySubmission } from "@/lib/submission";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: request.headers });
  const req = await createLocalReq({ user: auth.user ?? undefined }, payload);
  const userRole = await role(req);
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const allowed = data.action === "export" || data.action === "export-xlsx" ? await can(req, "residents.export")
    : data.action === "review" || data.action === "duplicates" ? await can(req, "residents.approve")
    : userRole === "administrator";
  if (!allowed) return Response.json({ error: "Your account does not have access to this action." }, { status: 403 });
  try {
    if (data.action === "export" || data.action === "export-xlsx") {
      const rows = await payload.find({
        collection: "residents",
        where: { status: { equals: "active" } },
        limit: 0,
        pagination: false,
        overrideAccess: false,
        req,
        depth: 0,
      });
      const keys = [
        "name",
        "spouseName",
        "address",
        "mobile",
        "email",
        "textGroup",
        "facebookGroup",
        "status",
        "signedUpAt",
        "createdAt",
        "updatedAt",
      ] as const;
      const csv = [
        keys.map(csvCell).join(","),
        ...rows.docs.map((doc) => keys.map((k) => csvCell(doc[k])).join(",")),
      ].join("\r\n");
      await payload.create({
        collection: "audit",
        overrideAccess: true,
        req,
        data: {
          actor: String(auth.user!.id),
          action: data.action === "export-xlsx" ? "xlsx-export" : "csv-export",
          entity: "residents",
          recordID: "all",
        },
      });
      if (data.action === "export-xlsx") {
        const { residentWorkbook } = await import("@/lib/resident-workbook");
        const bytes = await residentWorkbook(rows.docs);
        return new Response(bytes, {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition":
              'attachment; filename="wyndham-park-residents.xlsx"',
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
      return new Response("\uFEFF" + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="wyndham-park-residents.csv"',
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (data.action === "duplicates") {
      const submission = await payload.findByID({
        collection: "submissions",
        id: data.id,
        overrideAccess: false,
        req,
      });
      const matches = await payload.find({
        collection: "residents",
        overrideAccess: false,
        req,
        where: {
          or: [
            { email: { equals: submission.email } },
            { address: { equals: submission.address } },
            { name: { equals: submission.name } },
          ],
        },
        depth: 0,
        limit: 50,
      });
      return Response.json({
        matches: matches.docs.map((d) => ({
          id: d.id,
          name: d.name,
          address: d.address,
          email: d.email,
        })),
      });
    }
    if (data.action === "review") {
      return Response.json(await approveResident(payload, req, data));
    }
    if (data.action === "retry-notifications") {
      const pending = await payload.find({
        collection: "submissions",
        overrideAccess: false,
        req,
        where: { notification: { in: ["pending", "failed"] } },
        limit: 20,
      });
      for (const s of pending.docs) await notifySubmission(payload, s.id);
      return Response.json({
        message: `Retried ${pending.docs.length} notifications. Check their notification status in Submissions.`,
      });
    }
    if (data.action === "merge") return Response.json({ error: "Use Review Possible Duplicates to compare and merge records." }, { status: 400 });
    if (data.action === "invite") {
      if (!process.env.SMTP_HOST)
        throw new Error(
          "A verified email service must be connected before invitations can be sent.",
        );
      const users = await payload.find({
        collection: "users",
        overrideAccess: false,
        req,
        where: { email: { equals: String(data.email).trim().toLowerCase() } },
        limit: 1,
      });
      let invited = users.docs[0];
      if (!invited) {
        if (!["administrator", "editor", "board"].includes(data.role))
          throw new Error("Choose an administrator, board member, or editor role.");
        const assigned = await payload.find({ collection: "roles", overrideAccess: true, req, where: { key: { equals: data.role } }, limit: 1 });
        if (!assigned.docs.length) throw new Error("Choose an existing role in Access → Users.");
        invited = await payload.create({
          collection: "users",
          overrideAccess: false,
          req,
          data: {
            email: String(data.email).trim().toLowerCase(),
            password: crypto.randomUUID() + crypto.randomUUID(),
            role: data.role,
            roles: [assigned.docs[0].id],
            rolesMigrated: true,
            active: true,
          },
        });
      }
      if (!invited.active)
        throw new Error(
          "This account is inactive. Review it before restoring access.",
        );
      await payload.forgotPassword({
        collection: "users",
        data: { email: invited.email },
        req,
      });
      return Response.json({
        message: "A secure password setup link has been sent.",
      });
    }
    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Action failed." },
      { status: 400 },
    );
  }
}
