export function Prose({ text }: { text: string }) {
  return (
    <div className="prose">
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}
export function Contacts({
  people,
}: {
  people: {
    name: string;
    role: string;
    phone?: string | null;
    sourceYear?: number | null;
  }[];
}) {
  return (
    <div className="contacts">
      {people.map((p) => (
        <article key={p.role + p.name}>
          <div>
            <h3>{p.name}</h3>
            <p>
              {p.role}
              {p.sourceYear ? ` · ${p.sourceYear} notice` : ""}
            </p>
          </div>
          {p.phone ? <a href={"tel:" + p.phone.replace(/[^+\d]/g, "")}>
            {p.phone}
            <span aria-hidden="true"> ↗</span>
          </a> : null}
        </article>
      ))}
    </div>
  );
}
