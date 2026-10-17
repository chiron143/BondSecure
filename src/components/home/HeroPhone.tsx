"use client";

import { AlertTriangle, CheckCircle2, FileText, Languages, Scale, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { BorderBeam } from "@/components/ui/border-beam";
import { NumberTicker } from "@/components/ui/number-ticker";

// A phone showing what a student gets, built from real UI (not a picture), with sample data.
// Chips sit beside the phone (never over its content) and only on wide screens.
const CHIPS = [
  { Icon: Sparkles, text: "AI read 8 facts from 3 files", className: "left-[calc(100%-1.25rem)] top-10" },
  { Icon: Scale, text: "Boarding Houses Act 2012", className: "left-[calc(100%-1.25rem)] top-[48%]" },
  { Icon: Languages, text: "简体中文 · हिन्दी · +10", className: "right-[calc(100%-1.25rem)] bottom-16" },
];

export default function HeroPhone() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      {/* Phone */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2.4rem] border border-white/15 bg-slate-950 p-2.5 shadow-[0_40px_120px_-30px_rgba(16,185,129,0.55)]"
      >
        <BorderBeam size={140} duration={7} colorFrom="#34d399" colorTo="#60a5fa" />
        <div className="relative overflow-hidden rounded-[1.9rem] bg-slate-50 text-slate-900">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-slate-950" aria-hidden />
          <div className="space-y-3 p-4 pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-2.5 py-1 text-xs font-bold text-white">
              <AlertTriangle className="size-3.5" aria-hidden /> Refund <NumberTicker value={36} delay={0.6} className="text-white" /> days overdue
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">Boarding Houses Act 2012 · likely</p>
            <p className="text-lg leading-tight font-bold">Your deposit was due back on 3 September.</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              $<NumberTicker value={802} delay={0.9} className="text-emerald-700" /> <span className="text-xs font-medium text-slate-500">owed to you</span>
            </p>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
              {["Rule checked against NSW Government source", "Demand letter ready to send", "Claim pack with move-in photos"].map((t, i) => (
                <motion.p
                  key={t}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 + i * 0.25 }}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden /> {t}
                </motion.p>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white">
              <FileText className="size-4" aria-hidden /> Download my claim pack
            </div>
            <p className="pb-1 text-center text-[9px] text-slate-400">Sample case · Sample Rooms is not a real operator</p>
          </div>
        </div>
      </motion.div>

      {/* Floating chips */}
      {CHIPS.map(({ Icon, text, className }, i) => (
        <motion.div
          key={text}
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={reduce ? undefined : { opacity: { delay: 1 + i * 0.3 }, scale: { delay: 1 + i * 0.3 }, y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i } }}
          className={`absolute ${className} hidden items-center whitespace-nowrap lg:flex gap-1.5 rounded-full border border-white/15 bg-slate-900/90 px-3 py-1.5 text-[11px] font-medium text-slate-100 shadow-lg backdrop-blur`}
        >
          <Icon className="size-3.5 text-emerald-400" aria-hidden /> {text}
        </motion.div>
      ))}
    </div>
  );
}
