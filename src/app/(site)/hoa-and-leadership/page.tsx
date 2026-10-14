export const metadata = { title: "HOA & Leadership", description: "Wyndham Park HOA board members and standing committees." };
const board = [["President", "Mr. Nathaniel Thornton"], ["Vice president", "Vacant"], ["Secretary", "Ms. Annie Duvall"], ["Treasurer", "Mrs. Terry Harrison"], ["Assistance Secretary", "Vacant"], ["Sargent-At-Arms", "Vacant"]];
const committees = [["Membership Chairperson", "Ms. Edith Lee"], ["Finance Chairperson", "Vacant"], ["Safety/ Security Chairperson", "Vacant"], ["Beautification Chairperson", "Vacant"], ["Grievance Chairperson", "Vacant"], ["Public Relations Chairperson", "Vacant"]];
export default function Leadership() {
return <div className="wrap section"><p className="eyebrow">YOUR ASSOCIATION</p><h1>HOA & leadership.</h1><p className="lead narrow">Meet the board members and standing committee chairpersons of Wyndham Park Homeowners Association.</p><p>Leadership information supplied October 13, 2026.</p>
{[["Board Members", board], ["Standing Committees", committees]].map(([heading, rows]) => <section key={heading as string} style={{marginTop: "3rem"}}><h2>{heading as string}</h2><dl style={{margin: 0}}>{(rows as string[][]).map(([role,name]) => <div key={role} style={{display:"grid",gridTemplateColumns:"repeat(2, minmax(0, 1fr))",gap:"1rem",padding:"1.2rem 0",borderBottom:"1px solid #c9c8bd"}}><dt style={{fontWeight:600}}>{role}</dt><dd style={{margin:0}}>{name}</dd></div>)}</dl></section>)}
</div>;
}
