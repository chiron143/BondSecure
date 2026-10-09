import { formatDate } from "../rules/dates";
import { formatTimestamp } from "../movein/format";
import type { Condition, MoveInReport } from "../movein/types";
import { ACCENT, Doc, MUTED, WARN } from "./layout";

export const CONDITION_LABEL: Record<Condition, string> = {
  good: "Good",
  wear: "Fair wear",
  dirty: "Dirty / stained",
  damaged: "Damaged",
  not_working: "Not working",
};

export async function buildConditionReportPdf(r: MoveInReport): Promise<Uint8Array> {
  const items = r.items.filter((i) => i.status === "confirmed");
  const doc = await Doc.create(
    `Move-in condition evidence – ${r.propertyAddress}`,
    `Bond Secure move-in evidence · video SHA-256 ${r.video.sha256.slice(0, 16)}…`,
  );

  doc.text("MOVE-IN CONDITION EVIDENCE", { size: 9, bold: true, color: ACCENT, gap: 2 });
  doc.text(r.propertyAddress, { size: 20, bold: true, gap: 8 });
  if (r.demo) {
    doc.box(["DEMO: the findings in this report came from Bond Secure's demo mode, not a real analysis of this video."], WARN);
  }

  doc.text(`Tenant: ${r.tenantName}`, { gap: 1 });
  doc.text(`Move-in date: ${formatDate(r.moveInDate)}`, { gap: 1 });
  doc.text(`Report created: ${new Date(r.createdAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })} (Sydney time)`, { gap: 1 });
  const sydney = (iso: string) => new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Sydney" });
  doc.text(
    `Video: ${r.video.name}, ${formatTimestamp(r.video.durationSec)} long, ` +
      (r.video.recordedAt
        ? `recorded ${sydney(r.video.recordedAt)} Sydney time (from the video's own metadata)`
        : `file last modified ${sydney(r.video.lastModified)}`),
    { gap: 1 },
  );
  doc.text(`Video fingerprint (SHA-256): ${r.video.sha256}`, { size: 8.5, color: MUTED, gap: 8 });

  doc.box([
    "This report records the condition of the room when the tenant moved in, using stills taken from the tenant's own video. Each still shows the time in the video it came from. The fingerprint above identifies the exact video file: keep the original video.",
    "It adds to, and does not replace, the official condition report. In NSW the tenant must return the completed official condition report within 7 days of moving in. Attach this report to it.",
  ]);

  const counts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.condition] = (acc[i.condition] ?? 0) + 1;
    return acc;
  }, {});
  doc.heading("Summary", 13);
  doc.bullets(
    (Object.keys(CONDITION_LABEL) as Condition[])
      .filter((c) => counts[c])
      .map((c) => `${CONDITION_LABEL[c]}: ${counts[c]} item${counts[c] === 1 ? "" : "s"}`),
  );

  const rooms = [...new Set(items.map((i) => i.room))];
  for (const room of rooms) {
    doc.heading(room, 14);
    for (const i of items.filter((x) => x.room === room)) {
      const problem = i.condition !== "good";
      await doc.imageRow(i.frame, [
        { text: i.item, bold: true },
        { text: CONDITION_LABEL[i.condition], color: problem ? WARN : ACCENT },
        { text: i.note },
        { text: `Video time ${formatTimestamp(i.t)} · seen via ${i.source === "both" ? "video and narration" : i.source}`, color: MUTED },
      ]);
    }
    doc.rule();
  }

  doc.heading("Confirmation", 13);
  doc.text(
    `I, ${r.tenantName}, confirm that I filmed this video at the property on or around ${formatDate(r.moveInDate)} and that I reviewed each item in this report.`,
  );
  doc.text("Signed: ______________________________      Date: ________________", { gap: 10 });
  doc.text("Prepared with Bond Secure. Legal information, not legal advice.", { size: 8.5, color: MUTED });
  return doc.save();
}
