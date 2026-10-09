import { writeFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildDemandLetter, type Parties } from "../content/letters";
import { demoAnalysis } from "../movein/demo";
import type { MoveInReport } from "../movein/types";
import { buildVerdict } from "../rules/engine";
import type { CaseFacts } from "../rules/types";
import { buildClaimPackPdf } from "./claimPack";
import { buildConditionReportPdf } from "./conditionReport";
import { readReportData } from "./reportData";

// 1x1 grey JPEG, stands in for a video frame.
const FRAME =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=";

const facts: CaseFacts = {
  state: "NSW",
  who: "operator",
  agreement: "occupancy_agreement",
  residents: "5_or_more",
  bondLodged: "no",
  amountPaid: 802,
  weeklyRent: 401,
  datePaid: "2026-02-02",
  moveOutDate: "2026-08-20",
  agreementRefundDays: 15,
  reasonGiven: "still being processed",
};

const parties: Parties = {
  studentName: "Priya Sharma",
  studentEmail: "priya@example.com",
  propertyAddress: "Room 12, 100 Example Street, Surry Hills NSW 2010",
  landlordName: "Sample Rooms",
  landlordLegalName: "Sample Rooms Pty Ltd (ACN 000 000 000)",
};

const analysis = demoAnalysis(120);
const moveIn: MoveInReport = {
  propertyAddress: parties.propertyAddress,
  tenantName: "Priya Sharma 普丽雅", // non-Latin characters must not crash the PDF
  moveInDate: "2026-02-03",
  video: { name: "room.mp4", sizeBytes: 1, durationSec: 120, lastModified: "2026-02-03T10:00:00Z", recordedAt: "2026-02-03T09:55:00Z", sha256: "a".repeat(64) },
  items: analysis.rooms.flatMap((r) =>
    r.items.map((i, n) => ({ ...i, room: r.room, id: `${r.room}-${n}`, frame: FRAME, status: "confirmed" as const })),
  ),
  createdAt: "2026-02-03T11:00:00Z",
  demo: true,
};

describe("PDFs", () => {
  it("builds the condition report and claim pack", async () => {
    const verdict = buildVerdict(facts, "2026-10-09");
    const letter = buildDemandLetter(facts, verdict, parties, true, "2026-10-09");
    expect(letter.body).toContain("Boarding Houses Act 2012");
    expect(letter.body).toContain("36 days ago");
    expect(letter.body).toContain("Your own terms promised a refund");

    const report = await buildConditionReportPdf(moveIn);
    const pack = await buildClaimPackPdf({ facts, verdict, parties, letter, moveIn, today: "2026-10-09" });
    expect(report.length).toBeGreaterThan(1000);
    expect(pack.length).toBeGreaterThan(1000);

    // The move-in PDF carries its data, so it can be uploaded again months later.
    expect(await readReportData(report)).toEqual(moveIn);
    expect(await readReportData(pack)).toBeNull();
    expect(await readReportData(new TextEncoder().encode("not a pdf"))).toBeNull();

    const out = process.env.PDF_OUT;
    if (out) {
      mkdirSync(out, { recursive: true });
      writeFileSync(`${out}/condition-report.pdf`, report);
      writeFileSync(`${out}/claim-pack.pdf`, pack);
      writeFileSync(`${out}/letter.txt`, `${letter.subject}\n\n${letter.body}`);
    }
  });
});
