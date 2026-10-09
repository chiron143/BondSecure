// Turns AI findings the student ticked into form answers. Plain code: bad or unclear
// values are dropped rather than guessed, and nothing here decides which law applies.

import type { Parties } from "../content/letters";
import type { CaseFacts } from "../rules/types";
import type { EvidenceFinding } from "./types";

const num = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const date = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : undefined);
const text = (v: string) => v.trim() || undefined;

export function applyFindings(
  findings: EvidenceFinding[],
): { facts: Partial<CaseFacts>; parties: Partial<Parties> } {
  const facts: Partial<CaseFacts> = {};
  const parties: Partial<Parties> = {};

  for (const f of findings) {
    const v = f.value ?? "";
    switch (f.field) {
      case "amountPaid": facts.amountPaid = num(v) ?? facts.amountPaid; break;
      case "weeklyRent": facts.weeklyRent = num(v) ?? facts.weeklyRent; break;
      case "amountRefunded": facts.amountRefunded = num(v) ?? facts.amountRefunded; break;
      case "agreementRefundDays": facts.agreementRefundDays = num(v) ?? facts.agreementRefundDays; break;
      case "datePaid": facts.datePaid = date(v) ?? facts.datePaid; break;
      case "moveOutDate": facts.moveOutDate = date(v) ?? facts.moveOutDate; break;
      case "reasonGiven": facts.reasonGiven = text(v) ?? facts.reasonGiven; break;
      case "agreementType":
        if (v === "residential_tenancy_agreement" || v === "occupancy_agreement") facts.agreement = v;
        break;
      case "bondNumber":
        // A bond number from Fair Trading is the one fact that settles path A.
        if (text(v)) facts.bondLodged = "yes";
        break;
      case "landlordName": parties.landlordName = text(v) ?? parties.landlordName; break;
      case "landlordLegalName": parties.landlordLegalName = text(v) ?? parties.landlordLegalName; break;
      case "propertyAddress": parties.propertyAddress = text(v) ?? parties.propertyAddress; break;
      case "studentName": parties.studentName = text(v) ?? parties.studentName; break;
      case "studentEmail": parties.studentEmail = text(v) ?? parties.studentEmail; break;
    }
  }
  return { facts, parties };
}
