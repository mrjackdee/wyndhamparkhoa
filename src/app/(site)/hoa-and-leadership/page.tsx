import { pageMetadata } from "@/lib/seo";
const roleEmails: Record<string, string> = {
  "President": "president", "Vice president": "vicepresident",
  "Secretary": "secretary", "Treasurer": "treasurer",
  "Assistance Secretary": "asstsecretary", "Assistant Secretary": "asstsecretary", "Sargent-At-Arms": "sergeantatarms",
  "Membership Chairperson": "membership", "Finance Chairperson": "finance",
  "Safety/ Security Chairperson": "safetysecurity", "Beautification Chairperson": "beautification",
  "Grievance Chairperson": "grievance", "Public Relations Chairperson": "publicrelations",
};
function roleEmail(role: string) {
 const key = Object.keys(roleEmails).find(key => key.toLowerCase().replace(/[^a-z]/g, "") === role.toLowerCase().replace(/[^a-z]/g, ""));
 return key ? roleEmails[key] + "@wyndhamparkhoa.org" : undefined;
}
import { settings } from "@/lib/content";
export const metadata = pageMetadata("HOA & Leadership", "Wyndham Park HOA board members and standing committees.", "/hoa-and-leadership");
export default async function Leadership() {
 const site = await settings();
 return <div className="wrap section"><p className="eyebrow">YOUR ASSOCIATION</p><h1>HOA & leadership.</h1><p className="lead narrow">Board members and standing committee chairpersons of Wyndham Park Homeowners Association.</p>
 {["Board Members", "Standing Committees"].map(group => {const rows = (site.leadership ?? []).filter(p => p.group === group); return rows.length ? <section key={group} style={{marginTop:"3rem"}}><h2>{group}</h2><dl>{rows.map(p=><div key={p.id} style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"1rem",padding:"1.2rem 0",borderBottom:"1px solid #c9c8bd"}}><dt>{roleEmail(p.role) ? <a href={"mailto:" + roleEmail(p.role)}>{p.role}</a> : p.role}</dt><dd style={{margin:0}}>{p.name.trim().toLowerCase() === "vacant" ? "Open Position" : p.name}{roleEmail(p.role) && <a style={{display:"block",fontSize:14,overflowWrap:"anywhere",marginTop:6}} href={"mailto:" + roleEmail(p.role)}>{roleEmail(p.role)}</a>}<small style={{display:"block"}}>Source year: {p.sourceYear}</small></dd></div>)}</dl></section> : null;})}</div>;
}
