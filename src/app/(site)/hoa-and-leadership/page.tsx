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
export const metadata = { title: "HOA & Leadership", description: "Wyndham Park HOA board members and standing committees." };
const board = [["President", "Mr. Nathaniel Thornton"], ["Vice president", "Open Position"], ["Secretary", "Ms. Annie Duvall"], ["Treasurer", "Mrs. Terry Harrison"], ["Assistance Secretary", "Open Position"], ["Sargent-At-Arms", "Open Position"]];
const committees = [["Membership Chairperson", "Ms. Edith Lee"], ["Finance Chairperson", "Open Position"], ["Safety/ Security Chairperson", "Open Position"], ["Beautification Chairperson", "Open Position"], ["Grievance Chairperson", "Open Position"], ["Public Relations Chairperson", "Open Position"]];
export default function Leadership() {
return <div className="wrap section leadership-page"><p className="eyebrow">YOUR ASSOCIATION</p><h1>HOA & leadership.</h1><p className="lead narrow">Meet the board members and standing committee chairpersons of Wyndham Park Homeowners Association.</p><p>Leadership information supplied October 13, 2026.</p>
{[["Board Members", board], ["Standing Committees", committees]].map(([heading, rows]) => <section className="leadership-section" key={heading as string}><h2>{heading as string}</h2><dl style={{margin: 0}}>{(rows as string[][]).map(([role,name]) => <div key={role} className={name === "Open Position" ? "leadership-row vacant" : "leadership-row"}><dt style={{fontWeight:600}}>{roleEmail(role) ? <a href={"mailto:" + roleEmail(role)}>{role}</a> : role}</dt><dd style={{margin:0}}>{name}{roleEmail(role) && <a style={{display:"block",fontSize:14,overflowWrap:"anywhere",marginTop:6}} href={"mailto:" + roleEmail(role)}>{roleEmail(role)}</a>}</dd></div>)}</dl></section>)}
</div>;
}
