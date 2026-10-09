import { DISCLAIMER, HELP_CONTACTS, SOURCES } from "@/lib/content/sources";
import { formatDate } from "@/lib/rules/dates";

export const metadata = { title: "Where our rules come from · Bond Secure" };

export default function Sources() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display tracking-tight text-3xl font-semibold">Where our rules come from</h1>
      <p className="mt-3 text-muted">{DISCLAIMER}</p>
      <div className="mt-6 space-y-3">
        {SOURCES.map((s) => (
          <div key={s.id} className="card">
            <p className="text-[15px]">{s.rule}</p>
            <p className="mt-2 text-xs text-muted">
              <a className="underline" href={s.url}>{s.source}</a> · checked {formatDate(s.checked)}
            </p>
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-lg font-semibold">Free help</h2>
      <ul className="mt-3 space-y-2 text-[15px]">
        {HELP_CONTACTS.map((c) => (
          <li key={c.name}><a className="underline" href={c.url}>{c.name}</a>: {c.detail}</li>
        ))}
      </ul>
    </div>
  );
}
