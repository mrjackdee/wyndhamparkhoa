import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { residentWorkbook } from "../src/lib/resident-workbook";
test("resident Excel export preserves literal data, preferences, and usable formatting", async () => {
 const bytes = await residentWorkbook([{name:'=HYPERLINK("https://example.invalid")',spouseName:null,address:"123 Synthetic Lane",mobile:"0012345678",email:"qa@example.invalid",textGroup:"no",facebookGroup:"yes",status:"active",createdAt:"2026-01-01T00:00:00Z",updatedAt:"2026-01-02T00:00:00Z"}]);
 const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
 const sheet=workbook.getWorksheet("Resident contacts")!;
 assert.equal(sheet.getCell("A6").value,'=HYPERLINK("https://example.invalid")');
 assert.equal(sheet.getCell("A6").type,ExcelJS.ValueType.String);
 assert.equal(sheet.getCell("D6").value,"0012345678");
 assert.equal(sheet.getCell("F6").value,"No"); assert.equal(sheet.getCell("G6").value,"Yes");
 assert.equal(sheet.views[0].state,"frozen"); assert.ok(sheet.autoFilter);
 assert.equal(sheet.getRow(5).getCell(1).value,"Name");
 assert.equal(sheet.rowCount,6);
});
test("empty resident export remains a valid labeled workbook", async()=>{
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.load((await residentWorkbook([])).buffer as ArrayBuffer);
 assert.equal(workbook.getWorksheet("Resident contacts")?.getCell("A5").value,"Name");
});
