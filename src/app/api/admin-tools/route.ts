import { getPayload, createLocalReq } from "payload";
import config from "@payload-config";
import { role } from "@/lib/access";
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
  if (userRole !== "administrator" && userRole !== "board")
    return Response.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (userRole === "board" && !["duplicates", "review", "export", "export-xlsx"].includes(data.action))
    return Response.json({ error: "Administrator access required for this action." }, { status: 403 });
  try {
    if (data.action === "export" || data.action === "export-xlsx") {
      const rows = await payload.find({
        collection: "residents",
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
      if (!data.confirm)
        return Response.json(
          { error: "Review and confirm the selected resident first." },
          { status: 400 },
        );
      const transaction = await payload.db.beginTransaction();
      if (!transaction) throw new Error("Transactions unavailable");
      req.transactionID = transaction;
      try {
        await payload.create({
          collection: "review-claims",
          overrideAccess: true,
          req,
          data: { submissionID: String(data.id) },
        });
        const s = await payload.findByID({
          collection: "submissions",
          id: data.id,
          overrideAccess: false,
          req,
        });
        if (s.status !== "pending")
          throw new Error("This request has already been reviewed.");
        if (s.requestType === "update" && !data.residentID)
          throw new Error(
            "Select the existing resident for an update request.",
          );
        const fields = {
          name: s.name,
          spouseName: s.spouseName,
          address: s.address,
          mobile: s.mobile,
          email: s.email,
          textGroup: s.textGroup,
          facebookGroup: s.facebookGroup,
          status: "active" as const,
        };
        const resident = data.residentID
          ? await payload.update({
              collection: "residents",
              id: data.residentID,
              overrideAccess: false,
              req,
              data: fields,
            })
          : await payload.create({
              collection: "residents",
              overrideAccess: false,
              req,
              data: { ...fields, signedUpAt: s.createdAt },
            });
        await payload.update({
          collection: "submissions",
          id: s.id,
          overrideAccess: true,
          req,
          data: { status: "reviewed", resident: resident.id },
        });
        await payload.db.commitTransaction(transaction);
        return Response.json({
          message: "Request reviewed and resident record saved.",
        });
      } catch (error) {
        await payload.db.rollbackTransaction(transaction);
        throw error;
      }
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
    if (data.action === "merge") {
      if (
        !data.confirm ||
        !data.sourceID ||
        !data.targetID ||
        String(data.sourceID) === String(data.targetID)
      )
        throw new Error(
          "Choose two different resident records and confirm your review.",
        );
      const transaction = await payload.db.beginTransaction();
      if (!transaction) throw new Error("Transactions unavailable");
      req.transactionID = transaction;
      try {
        const source = await payload.findByID({
          collection: "residents",
          id: data.sourceID,
          overrideAccess: false,
          req,
        });
        const target = await payload.findByID({
          collection: "residents",
          id: data.targetID,
          overrideAccess: false,
          req,
        });
        if (source.status !== "active" || target.status !== "active")
          throw new Error("Both records must be active before merging.");
        await payload.update({
          collection: "residents",
          id: source.id,
          overrideAccess: false,
          req,
          data: {
            status: "archived",
            notes:
              (source.notes ?? "") +
              "\nMerged into resident " +
              target.id +
              ". Existing contact details retained in this archive.",
          },
        });
        await payload.update({
          collection: "residents",
          id: target.id,
          overrideAccess: false,
          req,
          data: {
            notes:
              (target.notes ?? "") +
              "\nMerged resident " +
              source.id +
              ". Survivor contact details and preferences retained after administrator review.",
          },
        });
        await payload.update({
          collection: "submissions",
          overrideAccess: true,
          req,
          where: { resident: { equals: source.id } },
          data: { resident: target.id },
        });
        await payload.db.commitTransaction(transaction);
        return Response.json({
          message:
            "Records merged. Survivor details retained; duplicate archived; reviewed submissions reassigned.",
        });
      } catch (error) {
        await payload.db.rollbackTransaction(transaction);
        throw error;
      }
    }
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
        invited = await payload.create({
          collection: "users",
          overrideAccess: false,
          req,
          data: {
            email: String(data.email).trim().toLowerCase(),
            password: crypto.randomUUID() + crypto.randomUUID(),
            role: data.role,
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
