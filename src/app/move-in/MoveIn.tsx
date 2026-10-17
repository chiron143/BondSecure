"use client";

import {
  Check,
  CheckCircle2,
  Download,
  FileDown,
  FileText,
  Lightbulb,
  Mail,
  MessageSquareHeart,
  Mic,
  PartyPopper,
  ScanSearch,
  Trash2,
  Undo2,
  Video,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Field, HeroBand, SectionCard } from "@/components/bold";
import { ShimmerAction } from "@/components/ShimmerLink";
import { Progress } from "@/components/ui/progress";
import { FEEDBACK_URL } from "@/lib/content/feedback";
import { tidyText } from "@/lib/content/tidy";
import { bestFrameTime, grabFrame, loadVideo, sha256 } from "@/lib/movein/browser";
import { demoAnalysis } from "@/lib/movein/demo";
import { formatTimestamp } from "@/lib/movein/format";
import { fileReader, readRecordedAt } from "@/lib/movein/mp4";
import type { Condition, MoveInAnalysis, MoveInReport, ReportItem } from "@/lib/movein/types";
import { CONDITION_LABEL, buildConditionReportPdf } from "@/lib/pdf/conditionReport";
import { downloadPdf } from "@/lib/pdf/layout";
import { todayIso } from "@/lib/rules/dates";
import { useStore } from "@/lib/store";
import WorkingPanel from "./WorkingPanel";

type Step = "details" | "working" | "review" | "done";

async function analyseLive(file: File, onStatus: (s: string) => void): Promise<MoveInAnalysis | "demo"> {
  onStatus("Preparing a secure upload…");
  const start = await fetch("/api/video/start-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sizeBytes: file.size, mimeType: file.type || "video/mp4", name: file.name }),
  }).then((r) => r.json());
  if (start.demo) return "demo";
  if (start.error) throw new Error(start.error);

  onStatus("Uploading your video for analysis…");
  // Bytes go straight to Google's upload URL; our server never handles the video.
  const up = await fetch(start.uploadUrl, {
    method: "POST",
    headers: { "X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize" },
    body: file,
  });
  if (!up.ok) throw new Error(`Upload failed (${up.status}).`);
  const uploaded = await up.json();
  const fileName: string | undefined = uploaded?.file?.name;
  if (!fileName) throw new Error("Upload finished but no file name came back.");

  onStatus("Watching your video and listening to your narration… (1 to 2 minutes)");
  const res = await fetch("/api/video/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  }).then((r) => r.json());
  if (res.error) throw new Error(res.error);
  return res as MoveInAnalysis;
}

export default function MoveIn() {
  const store = useStore();
  const reduce = useReducedMotion();
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [file, setFile] = useState<File | null>(null);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [moveInDate, setMoveInDate] = useState(todayIso());
  const [status, setStatus] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [error, setError] = useState("");
  const [report, setReport] = useState<MoveInReport | null>(null);
  const [refilm, setRefilm] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // A link to the exact file that was fingerprinted, so the student can keep that copy.
  const videoUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  async function run(forceDemo = false) {
    if (!file) return;
    setError("");
    setStep("working");
    try {
      setStartedAt(Date.now());
      setStatus("Opening your video…");
      const video = await loadVideo(file);
      videoRef.current = video;
      setStatus("Fingerprinting the video file…");
      const hash = await sha256(file);
      const recordedAt = await readRecordedAt(fileReader(file), file.size);

      const wantDemo = forceDemo || new URLSearchParams(window.location.search).has("demo");
      let analysis: MoveInAnalysis;
      let demo = wantDemo;
      if (wantDemo) {
        analysis = demoAnalysis(video.duration);
      } else {
        const live = await analyseLive(file, setStatus);
        demo = live === "demo";
        analysis = live === "demo" ? demoAnalysis(video.duration) : live;
      }

      setStatus("Taking stills from your video…");
      const items: ReportItem[] = [];
      for (const room of analysis.rooms) {
        for (const [n, i] of room.items.entries()) {
          // Pick the clearest frame near the AI's timestamp, and use that time in the report.
          const t = await bestFrameTime(video, i.t);
          items.push({ ...i, t, room: room.room, id: `${room.room}-${n}`, status: "pending", frame: await grabFrame(video, t) });
        }
      }
      setRefilm(analysis.refilm ?? []);
      setReport({
        propertyAddress: tidyText(address),
        tenantName: tidyText(name),
        moveInDate,
        video: {
          name: file.name,
          sizeBytes: file.size,
          durationSec: video.duration,
          lastModified: new Date(file.lastModified).toISOString(),
          recordedAt,
          sha256: hash,
        },
        items,
        createdAt: new Date().toISOString(),
        demo,
      });
      setStep("review");
    } catch (e) {
      setError((e as Error).message);
      setStep("details");
    }
  }

  const update = (id: string, patch: Partial<ReportItem>) =>
    setReport((r) => (r ? { ...r, items: r.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) } : r));

  async function finish() {
    if (!report) return;
    store.setMoveIn(report);
    downloadPdf(await buildConditionReportPdf(report), `move-in-report-${report.moveInDate}.pdf`);
    setStep("done");
  }

  if (step === "details" || step === "working") {
    const ready = file && address.trim() && name.trim() && moveInDate;
    return (
      <div>
        <HeroBand>
          <p className="text-sm font-bold tracking-wider text-emerald-300 uppercase">Moving in</p>
          <h1 className="mt-2 font-display text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">
            Film your room.{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">Get proof.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-navy-muted">
            A 2-minute narrated video becomes a condition report, with every mark timestamped and a still from your own video.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { Icon: Mic, t: "Talk while you film", d: "Say what you see: “chip on the desk”, “fan doesn't work”. The AI listens." },
              { Icon: ScanSearch, t: "Get close to every mark", d: "Hold still for a second or two on each one." },
              { Icon: Lightbulb, t: "Lights on, walk slowly", d: "About 2 minutes per room is plenty." },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 backdrop-blur">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-3 font-extrabold text-white">{t}</p>
                <p className="mt-1 text-sm text-navy-muted">{d}</p>
              </div>
            ))}
          </div>
        </HeroBand>

        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
          <SectionCard n={1} title="Your details" hint="These go on the report.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="addr" className="sm:col-span-2" label="Address of the room or property" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Room 12, 100 Example St, Surry Hills NSW 2010" />
              <Field id="name" label="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
              <Field id="date" label="Move-in date" type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
            </div>
          </SectionCard>

          <SectionCard n={2} title="Your walk-through video" hint="Film it now or pick one you already took. MP4 or MOV.">
            {step === "working" ? (
              <WorkingPanel status={status} startedAt={startedAt} />
            ) : (
              <>
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); const v = e.dataTransfer.files?.[0]; if (v?.type.startsWith("video/")) setFile(v); }}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                    dragging ? "border-primary bg-primary-soft" : "border-input bg-card hover:border-primary/60"
                  }`}
                >
                  {file && videoUrl ? (
                    <div className="flex w-full items-center gap-4 text-left">
                      <video src={videoUrl} muted playsInline preload="metadata" className="h-20 w-32 shrink-0 rounded-xl bg-black object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{file.name}</span>
                        <span className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB · tap to choose a different video</span>
                      </span>
                      <CheckCircle2 className="size-6 shrink-0 text-primary" aria-hidden />
                    </div>
                  ) : (
                    <>
                      <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                        <Video className="size-7" aria-hidden />
                      </span>
                      <span className="text-base font-bold">Drop your video here, or tap to film or choose one</span>
                      <span className="text-xs text-muted-foreground">MP4 or MOV from your phone</span>
                    </>
                  )}
                  <input id="video" type="file" accept="video/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
                <p className="text-xs text-muted-foreground">
                  Google&apos;s Gemini AI analyses it and we delete it straight after.{" "}
                  <Link className="underline" href="/privacy">How your data is handled</Link>
                </p>
              </>
            )}
            {error && (
              <div className="rounded-2xl border-2 border-warn/30 bg-warn-soft p-4 text-sm text-warn" role="alert">
                <p className="font-bold">That didn&apos;t work: {error}</p>
                <button className="mt-2 underline" onClick={() => run(true)}>Continue with demo analysis instead</button>
              </div>
            )}
          </SectionCard>

          {step !== "working" && (
            <ShimmerAction className="w-full py-5 text-lg" disabled={!ready} onClick={() => run()}>
              <ScanSearch className="size-5" aria-hidden /> Make my move-in report
            </ShimmerAction>
          )}
          {!ready && step !== "working" && (
            <p className="text-center text-sm text-muted-foreground">Add your address, name and video to start.</p>
          )}
        </div>
      </div>
    );
  }

  if (step === "review" && report) {
    const rooms = [...new Set(report.items.map((i) => i.room))];
    const pending = report.items.filter((i) => i.status === "pending").length;
    const checked = report.items.length - pending;
    const problems = report.items.filter((i) => i.status !== "removed" && i.condition !== "good").length;
    return (
      <div>
        <HeroBand>
          <p className="text-sm font-bold tracking-wider text-emerald-300 uppercase">Step 2 of 2</p>
          <h1 className="mt-2 font-display text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">Check every line.</h1>
          <p className="mt-4 max-w-xl text-lg text-navy-muted">
            This report is your evidence, so you have to stand behind it. Fix anything that&apos;s wrong, remove anything that
            isn&apos;t there, then confirm.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15">
              {report.items.length} things found
            </span>
            <span className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-bold text-red-100 ring-1 ring-red-300/20">
              {problems} already damaged, dirty or broken
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15">
              {rooms.length} room{rooms.length === 1 ? "" : "s"}
            </span>
          </div>
        </HeroBand>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {report.demo && (
            <p className="rounded-2xl border-2 border-warn/30 bg-warn-soft p-4 text-sm font-semibold text-warn">
              Demo mode: these findings are examples, not an analysis of your video. The stills are from your video.
            </p>
          )}
          {refilm.length > 0 && (
            <div className="mt-4 rounded-2xl bg-primary-soft p-4 text-sm">
              <p className="font-bold">Worth filming again:</p>
              <ul className="mt-1 list-disc pl-5">{refilm.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}

          {rooms.map((room) => (
            <section key={room} className="mt-10">
              <h2 className="mb-4 font-display text-2xl font-black tracking-tight">{room}</h2>
              <div className="space-y-4">
                {report.items.filter((i) => i.room === room).map((i, n) => (
                  <motion.div
                    key={i.id}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: Math.min(n * 0.05, 0.25) }}
                    className={`grid gap-5 rounded-3xl border-2 bg-card p-4 shadow-xl shadow-slate-900/5 transition sm:grid-cols-[260px_1fr] sm:p-5 ${
                      i.status === "removed" ? "border-border opacity-40" : i.status === "confirmed" ? "border-primary/50" : "border-border"
                    }`}
                  >
                    <div className="relative self-start overflow-hidden rounded-2xl bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {i.frame ? <img src={i.frame} alt={`${i.item} at ${formatTimestamp(i.t)}`} className="w-full" /> : <div className="aspect-video" />}
                      <span className="absolute top-2 left-2 rounded-lg bg-black/70 px-2 py-1 font-mono text-xs font-bold text-white backdrop-blur">
                        {formatTimestamp(i.t)}
                      </span>
                      {i.condition !== "good" && (
                        <span className="absolute top-2 right-2 rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white">{CONDITION_LABEL[i.condition]}</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        className="h-11 w-full rounded-xl border-2 border-border bg-card px-3 text-base font-bold outline-none focus:border-primary"
                        value={i.item}
                        onChange={(e) => update(i.id, { item: e.target.value })}
                        aria-label="What it is"
                      />
                      <select
                        className="h-11 w-full rounded-xl border-2 border-border bg-card px-3 text-[15px] font-semibold outline-none focus:border-primary"
                        value={i.condition}
                        onChange={(e) => update(i.id, { condition: e.target.value as Condition })}
                        aria-label="Condition"
                      >
                        {(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => <option key={c} value={c}>{CONDITION_LABEL[c]}</option>)}
                      </select>
                      <textarea
                        className="w-full rounded-xl border-2 border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                        rows={2}
                        value={i.note}
                        onChange={(e) => update(i.id, { note: e.target.value })}
                        aria-label="What you can see"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {i.confidence} confidence · seen via {i.source === "both" ? "video and narration" : i.source}
                        </span>
                        <span className="flex gap-2">
                          <button
                            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition ${
                              i.status === "confirmed" ? "bg-primary text-primary-foreground shadow-md shadow-emerald-700/30" : "border-2 border-border hover:border-primary"
                            }`}
                            onClick={() => update(i.id, { status: "confirmed" })}
                          >
                            <Check className="size-4" aria-hidden /> {i.status === "confirmed" ? "Confirmed" : "Confirm"}
                          </button>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border px-4 py-2 text-sm font-bold hover:border-warn hover:text-warn"
                            onClick={() => update(i.id, { status: i.status === "removed" ? "pending" : "removed" })}
                          >
                            {i.status === "removed" ? <><Undo2 className="size-4" aria-hidden /> Undo</> : <><Trash2 className="size-4" aria-hidden /> Remove</>}
                          </button>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}

          <div className="sticky bottom-3 z-10 mt-10 rounded-2xl border border-border bg-card/90 p-3 shadow-2xl shadow-slate-900/20 backdrop-blur sm:rounded-3xl sm:p-4">
            <div className="flex items-center gap-3">
              <Progress value={(checked / Math.max(report.items.length, 1)) * 100} className="h-2 flex-1" aria-label="Lines checked" />
              <span className="shrink-0 text-xs font-bold tabular-nums sm:text-sm">{pending ? `${pending} still to check` : "All checked"}</span>
            </div>
            <div className="mt-2.5 flex gap-2 sm:justify-end">
              {pending > 0 && (
                <button
                  className="flex-1 rounded-xl border-2 border-border px-3 py-2.5 text-sm font-bold hover:border-primary sm:flex-none sm:rounded-2xl sm:px-5 sm:py-3"
                  onClick={() => setReport({ ...report, items: report.items.map((i) => (i.status === "pending" ? { ...i, status: "confirmed" } : i)) })}
                >
                  Confirm the rest
                </button>
              )}
              <ShimmerAction className="flex-1 px-4 py-2.5 text-sm sm:flex-none sm:px-7 sm:py-4 sm:text-base" disabled={pending > 0} onClick={finish}>
                <FileDown className="size-5" aria-hidden /> <span className="sm:hidden">Create PDF</span><span className="hidden sm:inline">Create my report (PDF)</span>
              </ShimmerAction>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const r = report!;
  const mailto = `mailto:?subject=${encodeURIComponent(`Move-in condition report – ${r.propertyAddress}`)}&body=${encodeURIComponent(
    `Hi,\n\nPlease find attached my move-in condition report for ${r.propertyAddress}, with photos from my walk-through video on ${r.moveInDate}. Please keep it with my file.\n\nThanks,\n${r.tenantName}`,
  )}`;
  const steps = [
    {
      Icon: Mail,
      t: "Email it to your landlord or manager today",
      d: "Attach the PDF. Their reply, or even just your sent email, dates your evidence.",
      action: <a className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" href={mailto}><Mail className="size-4" aria-hidden /> Open an email to send it</a>,
    },
    {
      Icon: Video,
      t: "Save this exact video",
      d: "The report contains its fingerprint, which proves the stills came from that file. Phones often shrink a video when you upload it, so the copy in your camera roll may not match.",
      action: file ? (
        <a
          className="inline-flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2.5 text-sm font-bold hover:border-primary"
          href={videoUrl}
          download={`move-in-video-${r.moveInDate}-${r.video.sha256.slice(0, 8)}.${file.name.split(".").pop() || "mp4"}`}
        >
          <Download className="size-4" aria-hidden /> Save the exact video ({(file.size / 1024 / 1024).toFixed(1)} MB)
        </a>
      ) : null,
    },
    {
      Icon: FileText,
      t: "Return the official condition report too",
      d: "In NSW you have 7 days from moving in. Attach this report to it.",
      action: null,
    },
  ];
  return (
    <div>
      <HeroBand>
        <motion.span
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-500/40"
        >
          <PartyPopper className="size-8" aria-hidden />
        </motion.span>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">Your report is ready.</h1>
        <p className="mt-4 max-w-xl text-lg text-navy-muted">
          It&apos;s downloaded. Keep the PDF: if your bond isn&apos;t returned, upload it to Bond Secure and your evidence goes
          straight into your claim.
        </p>
      </HeroBand>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        {steps.map(({ Icon, t, d, action }, n) => (
          <div key={t} className="flex gap-4 rounded-3xl border border-border bg-card p-5 shadow-xl shadow-slate-900/5 sm:p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 font-display text-lg font-black text-white">
              {n + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight"><Icon className="size-5 text-primary" aria-hidden /> {t}</p>
              <p className="mt-1 text-[15px] text-muted-foreground">{d}</p>
              {action && <div className="mt-3">{action}</div>}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-5 py-3 text-sm font-bold hover:border-primary"
            onClick={async () => downloadPdf(await buildConditionReportPdf(r), `move-in-report-${r.moveInDate}.pdf`)}
          >
            <FileDown className="size-4" aria-hidden /> Download again
          </button>
          <Link className="inline-flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-5 py-3 text-sm font-bold hover:border-primary" href="/recover">
            Bond not returned? Start a claim
          </Link>
          <a className="inline-flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-5 py-3 text-sm font-bold hover:border-primary" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
            <MessageSquareHeart className="size-4 text-primary" aria-hidden /> Give feedback (2 min)
          </a>
        </div>
      </div>
    </div>
  );
}
