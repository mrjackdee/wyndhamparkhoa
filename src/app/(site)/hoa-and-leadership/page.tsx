import { settings } from "@/lib/content";
export const metadata = { title: "HOA & Leadership", description: "Wyndham Park HOA board members and standing committees." };
export default async function Leadership() {
 const site = await settings();
 return <div className="wrap section"><p className="eyebrow">YOUR ASSOCIATION</p><h1>HOA & leadership.</h1><p className="lead narrow">Board members and standing committee chairpersons of Wyndham Park Homeowners Association.</p>
 {["Board Members", "Standing Committees"].map(group => {const rows = (site.leadership ?? []).filter(p => p.group === group); return rows.length ? <section key={group} style={{marginTop:"3rem"}}><h2>{group}</h2><dl>{rows.map(p=><div key={p.id} style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"1rem",padding:"1.2rem 0",borderBottom:"1px solid #c9c8bd"}}><dt>{p.role}</dt><dd style={{margin:0}}>{p.name}<small style={{display:"block"}}>Source year: {p.sourceYear}</small></dd></div>)}</dl></section> : null;})}</div>;
}
