"use client";

// Bold building blocks shared by the flows: a dark hero band, numbered section cards,
// big icon choice cards and labelled fields.

import { Check, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";

/** Dark band with a drifting glow, used at the top of each flow screen. */
export function HeroBand({ children, tone = "emerald", className }: { children: ReactNode; tone?: "emerald" | "red"; className?: string }) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-navy text-navy-ink", className)}>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className={cn("animate-aurora absolute -top-40 -left-32 size-[30rem] rounded-full blur-3xl", tone === "red" ? "bg-red-500/30" : "bg-emerald-500/30")} />
        <div className="animate-aurora-slow absolute -right-40 -bottom-40 size-[28rem] rounded-full bg-sky-500/20 blur-3xl" />
        <GridPattern width={44} height={44} className="fill-white/[0.02] stroke-white/[0.06] [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]" />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">{children}</div>
    </section>
  );
}

/** A numbered card for one part of a form. */
export function SectionCard({
  n,
  title,
  hint,
  children,
  className,
}: {
  n: number;
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rounded-3xl border border-border bg-card p-5 shadow-xl shadow-slate-900/5 sm:p-7", className)}
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 font-display text-lg font-black text-white shadow-lg shadow-emerald-700/30">
          {n}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="mt-6 space-y-7">{children}</div>
    </motion.section>
  );
}

export type ChoiceOpt<T extends string> = { v: T; label: string; hint?: string; Icon?: LucideIcon };

/** Big tappable option cards with an icon and a tick when chosen. */
export function ChoiceCards<T extends string>({
  name,
  opts,
  value,
  onChange,
  cols = 2,
}: {
  name: string;
  opts: ChoiceOpt<T>[];
  value?: T;
  onChange: (v: T) => void;
  cols?: 2 | 3;
}) {
  return (
    <div className={cn("grid gap-2.5", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {opts.map(({ v, label, hint, Icon }) => {
        const on = value === v;
        return (
          <label
            key={v}
            className={cn(
              "group relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition duration-200 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              on
                ? "border-primary bg-primary-soft shadow-lg shadow-emerald-700/10"
                : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
            )}
          >
            <input type="radio" name={name} className="sr-only" checked={on} onChange={() => onChange(v)} />
            {Icon && (
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl transition",
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] leading-snug font-semibold">{label}</span>
              {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
            </span>
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border-2 transition",
                on ? "border-primary bg-primary text-primary-foreground" : "border-input",
              )}
              aria-hidden
            >
              {on && <Check className="size-3.5" strokeWidth={3} />}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** A question with a big label; turns red when it's missing after a submit attempt. */
export function Question({ id, label, flagged, children }: { id: string; label: string; flagged?: boolean; children: ReactNode }) {
  return (
    <div id={id} className={cn("scroll-mt-28 rounded-2xl transition", flagged && "ring-2 ring-warn ring-offset-8 ring-offset-card")}>
      <p className={cn("mb-3 text-base font-bold", flagged && "text-warn")}>
        {label}
        {flagged && <span className="ml-2 text-sm font-semibold">· please answer</span>}
      </p>
      {children}
    </div>
  );
}

/** Label + input in the bold style. */
export function Field({
  id,
  label,
  flagged,
  className,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; flagged?: boolean }) {
  return (
    <div className={cn("scroll-mt-28", className)}>
      <label htmlFor={id} className={cn("mb-1.5 block text-sm font-bold", flagged && "text-warn")}>
        {label}
        {flagged && <span className="ml-1 font-semibold">· please answer</span>}
      </label>
      <input
        id={id}
        {...input}
        className={cn(
          "h-12 w-full rounded-xl border-2 bg-card px-4 text-[15px] outline-none transition focus:border-primary focus:ring-3 focus:ring-ring/30",
          flagged ? "border-warn" : "border-border",
        )}
      />
    </div>
  );
}
