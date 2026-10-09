import { buildNcatKit } from "../content/ncatKit";
import type { Letter, Parties } from "../content/letters";
import { DISCLAIMER, HELP_CONTACTS, SOURCES } from "../content/sources";
import { formatDate, todayIso } from "../rules/dates";
import type { CaseFacts, Verdict } from "../rules/types";
import { formatTimestamp } from "../movein/format";
import type { MoveInReport } from "../movein/types";
import { CONDITION_LABEL } from "./conditionReport";
import { ACCENT, Doc, MUTED, WARN } from "./layout";

const money = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 });

export async function buildClaimPackPdf(args: {
  facts: CaseFacts;
  verdict: Verdict;
  parties: Parties;
  letter: Letter;
  moveIn?: MoveInReport;
  today?: string;
}): Promise<Uint8Array> {
  const { facts, verdict, parties, letter, moveIn } = args;
  const today = args.today ?? todayIso();
  const doc = await Doc.create(`Bond claim pack – ${parties.propertyAddress}`, `Bond Secure claim pack · ${parties.studentName}`);

  // 1. Cover and verdict
  doc.text("BOND CLAIM PACK", { size: 9, bold: true, color: ACCENT, gap: 2 });
  doc.text(parties.propertyAddress, { size: 20, bold: true, gap: 4 });
  doc.text(`Prepared for ${parties.studentName} on ${formatDate(today)}`, { color: MUTED, gap: 12 });
  doc.text(verdict.title, { size: 15, bold: true, gap: 6 });
  doc.text(`Amount owed: ${money(verdict.amountOwed)}`, { size: 13, bold: true, color: ACCENT, gap: 8 });
  doc.text(verdict.summary, { gap: 8 });
  if (verdict.lawName) doc.text(`Rules that apply: ${verdict.lawName} (${verdict.confidence})`, { color: MUTED, gap: 8 });

  doc.heading("Why we think this", 12);
  doc.bullets(verdict.because);

  if (verdict.deadlines.length) {
    doc.heading("Deadlines", 12);
    doc.bullets(
      verdict.deadlines.map((d) =>
        [
          d.label,
          d.dueDate ? `: ${formatDate(d.dueDate)}` : "",
          d.daysOverdue ? ` (${d.daysOverdue} days ago)` : "",
          d.note ? `. ${d.note}` : "",
        ].join(""),
      ),
    );
  }
  if (verdict.flags.length) {
    doc.heading("Also worth knowing", 12);
    doc.bullets(verdict.flags, { color: WARN });
  }
  doc.heading("What to do, in order", 12);
  doc.bullets(verdict.nextSteps, { numbered: true });
  doc.box([DISCLAIMER], WARN);

  // 2. Demand letter
  doc.newPage();
  doc.text("YOUR LETTER", { size: 9, bold: true, color: ACCENT, gap: 2 });
  doc.text("Send this by email so you have a dated record. Keep the reply.", { color: MUTED, gap: 10 });
  doc.text(`Subject: ${letter.subject}`, { bold: true, gap: 10 });
  doc.text(letter.body);

  // 3. Timeline
  doc.newPage();
  doc.heading("Evidence timeline");
  const events: { date: string; what: string }[] = [];
  if (facts.datePaid) events.push({ date: facts.datePaid, what: `Paid ${money(facts.amountPaid)} bond/deposit` });
  if (moveIn) events.push({ date: moveIn.moveInDate, what: `Moved in; filmed move-in video (${moveIn.items.filter((i) => i.status === "confirmed" && i.condition !== "good").length} existing problems recorded)` });
  events.push({ date: facts.moveOutDate, what: "Moved out and returned keys" });
  for (const d of verdict.deadlines) if (d.dueDate) events.push({ date: d.dueDate, what: d.label });
  events.push({ date: today, what: `Claim pack prepared; ${money(verdict.amountOwed)} still owed` });
  events.sort((a, b) => a.date.localeCompare(b.date));
  doc.bullets(events.map((e) => `${formatDate(e.date)} – ${e.what}`));

  // 4. Move-in evidence: problems that were already there
  if (moveIn) {
    const problems = moveIn.items.filter((i) => i.status === "confirmed" && i.condition !== "good");
    doc.heading("Already there when I moved in");
    doc.text(
      `Stills from my move-in video of ${formatDate(moveIn.moveInDate)} (fingerprint ${moveIn.video.sha256.slice(0, 16)}…). If the landlord claims for any of these, they were not caused by me.`,
      { color: MUTED, gap: 8 },
    );
    if (moveIn.demo) doc.box(["DEMO: these findings came from demo mode."], WARN);
    for (const i of problems) {
      await doc.imageRow(i.frame, [
        { text: `${i.room}: ${i.item}`, bold: true },
        { text: CONDITION_LABEL[i.condition], color: WARN },
        { text: i.note },
        { text: `Video time ${formatTimestamp(i.t)}`, color: MUTED },
      ]);
    }
  }

  // 5. NCAT kit
  doc.newPage();
  doc.heading("If they don't pay: NCAT application kit");
  for (const s of buildNcatKit(facts, verdict, parties)) {
    doc.heading(s.heading, 11.5);
    doc.bullets(s.items);
  }

  // 6. Help and sources
  doc.heading("Free help");
  doc.bullets(HELP_CONTACTS.map((c) => `${c.name}: ${c.detail} (${c.url})`));
  doc.text("Get help before you act if: " + verdict.getHelpIf.join("; ") + ".", { gap: 10 });
  doc.heading("Where these rules come from", 12);
  doc.bullets(SOURCES.filter((s) => !s.id.startsWith("research")).map((s) => `${s.source}, checked ${formatDate(s.checked)}: ${s.url}`), { size: 8.5, color: MUTED });

  return doc.save();
}
