import { BookOpen, ExternalLink, FlaskConical, LifeBuoy } from "lucide-react";
import { HeroBand } from "@/components/bold";
import { DISCLAIMER, HELP_CONTACTS, SOURCES } from "@/lib/content/sources";
import { formatDate } from "@/lib/rules/dates";

export const metadata = { title: "Where our rules come from · Bond Secure" };

export default function Sources() {
  const rules = SOURCES.filter((s) => !s.id.startsWith("research"));
  const research = SOURCES.filter((s) => s.id.startsWith("research"));
  return (
    <div>
      <HeroBand>
        <p className="text-sm font-bold tracking-wider text-emerald-300 uppercase">Sources</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">
          Where our rules{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">come from.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy-muted">{DISCLAIMER}</p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold text-white">
          <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">{rules.length} legal rules</span>
          <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">{research.length} research sources</span>
          <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">Each with the date we checked it</span>
        </div>
      </HeroBand>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6">
        {[
          { title: "The legal rules", Icon: BookOpen, list: rules },
          { title: "Research behind the problem", Icon: FlaskConical, list: research },
        ].map(({ title, Icon, list }) => (
          <section key={title}>
            <h2 className="flex items-center gap-2 font-display text-2xl font-black tracking-tight">
              <Icon className="size-6 text-primary" aria-hidden /> {title}
            </h2>
            <div className="mt-4 space-y-3">
              {list.map((s) => (
                <div key={s.id} className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-slate-900/5 sm:p-6">
                  <p className="text-[15px] leading-relaxed">{s.rule}</p>
                  <a className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground underline" href={s.url}>
                    {s.source} · checked {formatDate(s.checked)} <ExternalLink className="size-3" aria-hidden />
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="flex items-center gap-2 font-display text-2xl font-black tracking-tight">
            <LifeBuoy className="size-6 text-primary" aria-hidden /> Free help
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {HELP_CONTACTS.map((c) => (
              <a
                key={c.name}
                href={c.url}
                className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <p className="font-extrabold">{c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.detail}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
