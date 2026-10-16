import ExcelJS from "exceljs";

type ExportResident = {
  name: string;
  spouseName?: string | null;
  address: string;
  mobile?: string | null;
  email: string;
  textGroup: string;
  facebookGroup: string;
  status: string;
  signedUpAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
export async function residentWorkbook(
  records: ExportResident[],
  generated = new Date(),
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Wyndham Park Homeowners Association";
  workbook.created = generated;
  const sheet = workbook.addWorksheet("Resident contacts", {
    views: [{ state: "frozen", ySplit: 5, showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: "1:5",
    },
  });
  sheet.columns = [
    { width: 26 },
    { width: 26 },
    { width: 42 },
    { width: 20 },
    { width: 38 },
    { width: 20 },
    { width: 22 },
    { width: 16 },
    { width: 24 },
    { width: 24 },
  ];
  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = "WYNDHAM PARK HOA | Resident contacts";
  sheet.getCell("A1").font = {
    name: "Calibri",
    size: 20,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF284B3C" },
  };
  sheet.getRow(1).height = 38;
  sheet.mergeCells("A2:J2");
  sheet.getCell("A2").value =
    "CONFIDENTIAL • HOA administration and community communication only";
  sheet.getCell("A2").font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FF75482F" },
  };
  sheet.mergeCells("A3:J3");
  sheet.getCell("A3").value =
    `Exported ${generated.toISOString().replace("T", " ").slice(0, 19)} UTC | ${records.length} resident records | Includes active and archived records`;
  sheet.mergeCells("A4:J4");
  sheet.getCell("A4").value =
    "Communication preferences do not confirm group membership. This list does not establish dues payment or financial standing.";
  sheet.getRow(4).height = 30;
  sheet.getCell("A4").alignment = { wrapText: true, vertical: "middle" };
  const headers = [
    "Name",
    "Spouse name",
    "Address",
    "Mobile",
    "Email",
    "Text group preference",
    "Facebook preference",
    "Record status",
    "Website signup (UTC)",
    "Updated (UTC)",
  ];
  sheet.getRow(5).values = headers;
  sheet.getRow(5).height = 32;
  sheet.getRow(5).eachCell((cell) => {
    cell.font = { name: "Calibri", bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF284B3C" },
    };
    cell.alignment = { wrapText: true, vertical: "middle" };
  });
  for (const resident of records) {
    const date = (value: string) =>
      Number.isNaN(Date.parse(value)) ? "" : new Date(value);
    const row = sheet.addRow([
      resident.name,
      resident.spouseName ?? "",
      resident.address,
      resident.mobile ?? "",
      resident.email,
      resident.textGroup === "yes" ? "Yes" : "No",
      resident.facebookGroup === "yes" ? "Yes" : "No",
      resident.status,
      date(resident.signedUpAt ?? ""),
      date(resident.updatedAt),
    ]);
    row.height = 34;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF29312C" } };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: row.number % 2 === 0 ? "FFF0F3EC" : "FFFFFFFF" },
      };
    });
    row.getCell(4).numFmt = "@";
    row.getCell(9).numFmt = "mmm d, yyyy hh:mm";
    row.getCell(10).numFmt = "mmm d, yyyy hh:mm";
  }
  sheet.autoFilter = { from: "A5", to: `J${Math.max(5, sheet.rowCount)}` };
  sheet.headerFooter.oddFooter =
    "&LConfidential | Wyndham Park HOA&RPage &P of &N";
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
