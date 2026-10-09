import { describe, expect, it } from "vitest";
import { applyFindings } from "./apply";
import { demoExtraction } from "./demo";
import type { EvidenceFinding } from "./types";

const f = (field: EvidenceFinding["field"], value: string): EvidenceFinding => ({ field, value, quote: "", document: "x.png" });

describe("applyFindings", () => {
  it("fills facts and parties from the demo extraction", () => {
    const { facts, parties } = applyFindings(demoExtraction(["a.png", "b.png", "c.png"]).findings);
    expect(facts).toMatchObject({ amountPaid: 802, weeklyRent: 401, datePaid: "2026-02-02", agreementRefundDays: 15, agreement: "occupancy_agreement" });
    expect(parties).toMatchObject({ landlordName: "Sample Rooms", landlordLegalName: "Sample Rooms Pty Ltd" });
  });

  it("cleans money and drops values it can't trust", () => {
    const { facts } = applyFindings([f("amountPaid", "$1,250.50"), f("datePaid", "02/03/2026"), f("weeklyRent", "about a week"), f("agreementType", "lease")]);
    expect(facts.amountPaid).toBe(1250.5);
    expect(facts.datePaid).toBeUndefined();
    expect(facts.weeklyRent).toBeUndefined();
    expect(facts.agreement).toBeUndefined();
  });

  it("treats a Fair Trading bond number as a lodged bond", () => {
    expect(applyFindings([f("bondNumber", "1234567")]).facts.bondLodged).toBe("yes");
    expect(applyFindings([f("bondNumber", " ")]).facts.bondLodged).toBeUndefined();
  });

  it("never sets who they rented from or the state: the student answers those", () => {
    const { facts } = applyFindings(demoExtraction([]).findings);
    expect(facts.who).toBeUndefined();
    expect(facts.state).toBeUndefined();
    expect(facts.residents).toBeUndefined();
  });
});
