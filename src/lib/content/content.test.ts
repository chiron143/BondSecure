import { describe, expect, it } from "vitest";
import { demoAnalysis } from "../movein/demo";
import type { MoveInReport } from "../movein/types";
import { moveInFitsCase } from "../movein/usable";
import { buildVerdict } from "../rules/engine";
import type { CaseFacts } from "../rules/types";
import { buildDemandLetter, type Parties } from "./letters";
import { buildNcatKit } from "./ncatKit";
import { tidyParties, tidyText } from "./tidy";

const facts: CaseFacts = {
  state: "NSW",
  who: "operator",
  agreement: "occupancy_agreement",
  residents: "5_or_more",
  bondLodged: "no",
  amountPaid: 800,
  weeklyRent: 340,
  datePaid: "2026-08-15",
  moveOutDate: "2026-08-20",
  agreementRefundDays: 15,
};

// As typed on a phone in the first real test.
const messy: Parties = {
  studentName: " Chiranth R ",
  propertyAddress: "510 , cleveland street , surry hills",
  landlordName: "Regan",
  landlordLegalName: "Living high ",
};

describe("tidying what people type", () => {
  it("fixes spaces around commas and brackets", () => {
    expect(tidyText("510 , cleveland street ,  surry hills ")).toBe("510, cleveland street, surry hills");
    expect(tidyText("( Living high )")).toBe("(Living high)");
  });

  it("drops empty optional fields", () => {
    expect(tidyParties({ ...messy, landlordLegalName: "  " }).landlordLegalName).toBeUndefined();
  });

  it("keeps stray spaces out of the letter", () => {
    const v = buildVerdict(facts, "2026-10-10");
    const letter = buildDemandLetter(facts, v, messy, false, "2026-10-10");
    expect(letter.body).toContain("To: Regan (Living high)");
    expect(letter.body).toContain("510, cleveland street, surry hills");
    expect(letter.body).not.toMatch(/ ,| \)/);
  });
});

describe("NCAT kit", () => {
  const kit = buildNcatKit(facts, buildVerdict(facts, "2026-10-10"), messy);
  const text = kit.flatMap((s) => s.items).join("\n");

  it("names the company as respondent without calling a person a trading name", () => {
    expect(text).toContain('Living high (you dealt with them as "Regan")');
    expect(text).not.toContain("trading as");
  });

  it("writes dates the way people read them", () => {
    expect(text).toContain("on 15 August 2026");
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe("move-in evidence", () => {
  const report = (moveInDate: string): MoveInReport => ({
    propertyAddress: "x",
    tenantName: "y",
    moveInDate,
    video: { name: "v.mov", sizeBytes: 1, durationSec: 10, lastModified: "2026-01-01T00:00:00Z", sha256: "a".repeat(64) },
    items: demoAnalysis(10).rooms[0].items.map((i, n) => ({ ...i, room: "Bedroom", id: String(n), status: "confirmed" as const })),
    createdAt: "2026-01-01T00:00:00Z",
    demo: true,
  });

  it("only counts a report made before move-out", () => {
    expect(moveInFitsCase(report("2026-02-03"), facts)).toBe(true);
    expect(moveInFitsCase(report("2026-08-20"), facts)).toBe(true);
    expect(moveInFitsCase(report("2026-10-10"), facts)).toBe(false);
    expect(moveInFitsCase(undefined, facts)).toBe(false);
  });
});
