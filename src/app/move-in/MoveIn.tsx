"use client";

import Link from "next/link";
import { FEEDBACK_URL } from "@/lib/content/feedback";
import { FileDown, Loader2, ScanSearch } from "lucide-react";
import Stepper from "@/components/Stepper";
import { useEffect, useMemo, useRef, useState } from "react";
import { todayIso } from "@/lib/rules/dates";
import { demoAnalysis } from "@/lib/movein/demo";
import { grabFrame, loadVideo, sha256 } from "@/lib/movein/browser";
import { fileReader, readRecordedAt } from "@/lib/movein/mp4";
import { tidyText } from "@/lib/content/tidy";
import { formatTimestamp } from "@/lib/movein/format";
import type { Condition, MoveInAnalysis, MoveInReport, ReportItem } from "@/lib/movein/types";
import { CONDITION_LABEL, buildConditionReportPdf } from "@/lib/pdf/conditionReport";
import { downloadPdf } from "@/lib/pdf/layout";
import { useStore } from "@/lib/store";

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

  onStatus("Watching your video and listening to your narration… (about a minute)");
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
  const [step, setStep] = useState<Step>("details");
  const [file, setFile] = useState<File | null>(null);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [moveInDate, setMoveInDate] = useState(todayIso());
  const [status, setStatus] = useState("");
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
          items.push({ ...i, room: room.room, id: `${room.room}-${n}`, status: "pending", frame: await grabFrame(video, i.t) });
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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6"><Stepper current={1} compact /></div>
        <h1 className="font-display tracking-tight text-3xl font-semibold">Record your room on move-in day</h1>
        <p className="mt-3 text-muted">
          Walk through slowly. Get close to anything already damaged, dirty or broken, and say what you see out loud. Turn the
          lights on. Two minutes per room is plenty.
        </p>

        <div className="card mt-6 space-y-5">
          <div>
            <label className="label" htmlFor="addr">Address of the room or property</label>
            <input id="addr" className="field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Room 12, 100 Example St, Surry Hills NSW 2010" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Your full name</label>
              <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="date">Move-in date</label>
              <input id="date" type="date" className="field" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="video">Your walk-through video</label>
            <input id="video" type="file" accept="video/*" className="field" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="mt-1.5 text-xs text-muted">
              Film it now or pick a video you already took. MP4 or MOV. Google&apos;s Gemini AI analyses it and we delete it
              straight after. <Link className="underline" href="/privacy">How your data is handled</Link>
            </p>
          </div>
          {error && (
            <div className="rounded-xl bg-warn-soft p-4 text-sm text-warn">
              <p className="font-semibold">That didn&apos;t work: {error}</p>
              <button className="mt-2 underline" onClick={() => run(true)}>Continue with demo analysis instead</button>
            </div>
          )}
          <button className="btn-primary w-full" disabled={!ready || step === "working"} onClick={() => run()}>
            {step === "working" ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {status}</> : <><ScanSearch className="h-5 w-5" aria-hidden /> Make my move-in report</>}
          </button>
        </div>
      </div>
    );
  }

  if (step === "review" && report) {
    const rooms = [...new Set(report.items.map((i) => i.room))];
    const pending = report.items.filter((i) => i.status === "pending").length;
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6"><Stepper current={2} compact /></div>
        <h1 className="font-display tracking-tight text-3xl font-semibold">Check every line</h1>
        <p className="mt-3 text-muted">
          This report is your evidence, so you have to stand behind it. Fix anything that&apos;s wrong, remove anything that
          isn&apos;t there, then confirm.
        </p>
        {report.demo && (
          <p className="mt-4 rounded-xl bg-warn-soft p-3 text-sm text-warn">Demo mode: these findings are examples, not an analysis of your video. The stills are from your video.</p>
        )}
        {refilm.length > 0 && (
          <div className="mt-4 rounded-xl bg-accent-soft p-4 text-sm">
            <p className="font-semibold">Worth filming again:</p>
            <ul className="mt-1 list-disc pl-5">{refilm.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        )}

        {rooms.map((room) => (
          <section key={room} className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">{room}</h2>
            <div className="space-y-3">
              {report.items.filter((i) => i.room === room).map((i) => (
                <div key={i.id} className={`card grid gap-4 sm:grid-cols-[220px_1fr] ${i.status === "removed" ? "opacity-40" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {i.frame ? <img src={i.frame} alt={`${i.item} at ${formatTimestamp(i.t)}`} className="w-full rounded-lg" /> : <div />}
                  <div className="space-y-2">
                    <input className="field py-2 font-semibold" value={i.item} onChange={(e) => update(i.id, { item: e.target.value })} />
                    <select className="field py-2" value={i.condition} onChange={(e) => update(i.id, { condition: e.target.value as Condition })}>
                      {(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => <option key={c} value={c}>{CONDITION_LABEL[c]}</option>)}
                    </select>
                    <textarea className="field py-2 text-sm" rows={2} value={i.note} onChange={(e) => update(i.id, { note: e.target.value })} />
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{formatTimestamp(i.t)} · {i.confidence} confidence</span>
                      <span className="flex gap-2">
                        <button className={`rounded-full px-3 py-1.5 font-semibold ${i.status === "confirmed" ? "bg-accent text-accent-ink" : "border border-line"}`} onClick={() => update(i.id, { status: "confirmed" })}>
                          {i.status === "confirmed" ? "Confirmed" : "Confirm"}
                        </button>
                        <button className="rounded-full border border-line px-3 py-1.5" onClick={() => update(i.id, { status: i.status === "removed" ? "pending" : "removed" })}>
                          {i.status === "removed" ? "Undo" : "Remove"}
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="sticky bottom-4 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 shadow-lg">
          <span className="text-sm text-muted">{pending ? `${pending} still to check` : "All checked"}</span>
          <span className="flex gap-2">
            {pending > 0 && (
              <button className="btn-ghost" onClick={() => setReport({ ...report, items: report.items.map((i) => (i.status === "pending" ? { ...i, status: "confirmed" } : i)) })}>
                Confirm the rest
              </button>
            )}
            <button className="btn-primary" disabled={pending > 0} onClick={finish}><FileDown className="h-5 w-5" aria-hidden /> Create my report (PDF)</button>
          </span>
        </div>
      </div>
    );
  }

  const r = report!;
  const mailto = `mailto:?subject=${encodeURIComponent(`Move-in condition report – ${r.propertyAddress}`)}&body=${encodeURIComponent(
    `Hi,\n\nPlease find attached my move-in condition report for ${r.propertyAddress}, with photos from my walk-through video on ${r.moveInDate}. Please keep it with my file.\n\nThanks,\n${r.tenantName}`,
  )}`;
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6"><Stepper current={3} compact /></div>
      <h1 className="font-display tracking-tight text-3xl font-semibold">Your report is downloaded</h1>
      <div className="card mt-6 space-y-4 text-[15px]">
        <p><strong>1. Email it to your landlord or manager today.</strong> Attach the PDF. Their reply (or even just your sent email) dates your evidence.</p>
        <a className="btn-primary" href={mailto}>Open an email to send it</a>
        <p>
          <strong>2. Save this exact video.</strong> The report contains its fingerprint, which proves the stills came from that
          file. Phones often shrink a video when you upload it, so the copy in your camera roll may not match. Save this one too.
        </p>
        {file && (
          <a className="btn-ghost" href={videoUrl} download={`move-in-video-${r.moveInDate}-${r.video.sha256.slice(0, 8)}.${file.name.split(".").pop() || "mp4"}`}>
            Save the exact video ({(file.size / 1024 / 1024).toFixed(1)} MB)
          </a>
        )}
        <p><strong>3. Return the official condition report too.</strong> In NSW you have 7 days from moving in. Attach this report to it.</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-ghost" onClick={async () => downloadPdf(await buildConditionReportPdf(r), `move-in-report-${r.moveInDate}.pdf`)}>Download again</button>
        <Link className="btn-ghost" href="/recover">Bond not returned? Start a claim</Link>
        <a className="btn-ghost" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">Give feedback (2 min)</a>
      </div>
    </div>
  );
}
