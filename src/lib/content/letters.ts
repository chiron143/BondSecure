// Demand letters. Templates, not AI: the legal wording stays fixed and checkable.
// AI can later translate the plain-language explanation for the student, but the letter
// that goes to the landlord stays in English and exactly as written here.

import { addDays, formatDate, todayIso } from "../rules/dates";
import type { CaseFacts, Verdict } from "../rules/types";
import { tidyParties } from "./tidy";

export interface Parties {
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  propertyAddress: string;
  /** Name the student knows them by, e.g. "Fresh Rooms" */
  landlordName: string;
  /** Legal entity name if known, e.g. "Example Pty Ltd (ACN 000 000 000)" */
  landlordLegalName?: string;
}

export interface Letter {
  subject: string;
  body: string;
}

const money = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 });

export function buildDemandLetter(
  facts: CaseFacts,
  verdict: Verdict,
  p: Parties,
  hasMoveInReport: boolean,
  today: string = todayIso(),
): Letter {
  p = tidyParties(p);
  const payBy = formatDate(addDays(today, 7));
  const owed = money(verdict.amountOwed);
  const to = p.landlordLegalName ? `${p.landlordName} (${p.landlordLegalName})` : p.landlordName;
  const movedOut = formatDate(facts.moveOutDate);
  const paid = facts.datePaid ? ` on ${formatDate(facts.datePaid)}` : "";

  const evidence = [
    "receipts showing my payment",
    "my agreement",
    hasMoveInReport ? "a time-stamped move-in condition report with photos taken on the day I moved in" : null,
    "photos taken when I moved out",
    "our written communication",
  ].filter(Boolean) as string[];
  const evidenceText = evidence.slice(0, -1).join(", ") + " and " + evidence[evidence.length - 1];

  const sign = [
    "Regards,",
    p.studentName,
    p.studentEmail ?? "",
    p.studentPhone ?? "",
  ].filter(Boolean).join("\n");

  const promised = verdict.deadlines.find((d) => d.label.includes("promised"));
  const promisedLine =
    promised?.dueDate && (promised.daysOverdue ?? 0) > 0
      ? ` Your own terms promised a refund by ${formatDate(promised.dueDate)}, which is now ${promised.daysOverdue} days ago.`
      : "";

  const header = `To: ${to}\nDate: ${formatDate(today)}\nProperty: ${p.propertyAddress}\n\n`;

  switch (verdict.path) {
    case "A_LODGED_BOND":
      return {
        subject: `Bond refund – ${p.propertyAddress}`,
        body:
          header +
          `Dear ${p.landlordName},\n\n` +
          `I moved out of ${p.propertyAddress} on ${movedOut} and returned the keys. I have lodged a claim through Rental Bonds Online for the full bond of ${owed}.\n\n` +
          `I left the property in the same condition as when I moved in, apart from fair wear and tear. If you intend to claim any part of the bond, please send me the reason and supporting evidence (such as the outgoing condition report and invoices or quotes). I have ${evidenceText}, and I will rely on these if this goes to the NSW Civil and Administrative Tribunal.\n\n` +
          `I would prefer to resolve this quickly. Please let me know by ${payBy} if you agree to the full bond being returned.\n\n` +
          sign,
      };

    case "B_UNLODGED_BOND": {
      const lodge = verdict.deadlines.find((d) => d.label.startsWith("Date the bond"));
      return {
        subject: `Formal demand: repayment of rental bond – ${p.propertyAddress}`,
        body:
          header +
          `Dear ${p.landlordName},\n\n` +
          `I paid a rental bond of ${money(facts.amountPaid)}${paid} for ${p.propertyAddress}. I have never received confirmation from NSW Fair Trading that this bond was lodged.\n\n` +
          `Under section 162 of the Residential Tenancies Act 2010 (NSW), a bond must be lodged with NSW Fair Trading within 10 business days (or, for an agent, within 10 business days after the end of the month it was paid)` +
          (lodge?.dueDate ? `, which in my case was around ${formatDate(lodge.dueDate)}` : "") +
          `. Failing to do so is an offence.\n\n` +
          `My tenancy ended on ${movedOut} and I returned the keys. I request that you repay ${owed} to me in full by ${payBy}.${promisedLine}\n\n` +
          `If I have not received payment by that date, I will apply to the NSW Civil and Administrative Tribunal for an order for repayment, and may also report the unlodged bond to NSW Fair Trading. I have ${evidenceText}.\n\n` +
          `Please reply in writing.\n\n` +
          sign,
      };
    }

    case "C_BOARDING_HOUSE": {
      const due = verdict.deadlines.find((d) => d.label.startsWith("Legal deadline"));
      const late = due?.daysOverdue ?? 0;
      return {
        subject: `Formal demand: refund of security deposit – ${p.propertyAddress}`,
        body:
          header +
          `Dear ${p.landlordName},\n\n` +
          `I paid a security deposit of ${money(facts.amountPaid)}${paid} for my room at ${p.propertyAddress}. My occupancy ended on ${movedOut}.\n\n` +
          `Under the occupancy principles in the Boarding Houses Act 2012 (NSW), a security deposit must be refunded within 14 days after the resident leaves, less only permitted deductions. That date was ${due?.dueDate ? formatDate(due.dueDate) : "14 days after I left"}` +
          (late > 0 ? `, which is now ${late} days ago` : "") +
          `.${promisedLine}\n\n` +
          `I request that you refund ${owed} to me in full by ${payBy}. If you believe you are entitled to deduct anything, please tell me the amount and reason in writing and provide supporting evidence by the same date.\n\n` +
          `If I have not received payment by then, I will apply to the NSW Civil and Administrative Tribunal for an order for the refund. I have ${evidenceText}.\n\n` +
          sign,
      };
    }

    case "D_LODGER":
    case "REFER":
    default:
      return {
        subject: `Formal demand: refund of deposit – ${p.propertyAddress}`,
        body:
          header +
          `Dear ${p.landlordName},\n\n` +
          `I paid a deposit of ${money(facts.amountPaid)}${paid} for my room at ${p.propertyAddress}. I moved out on ${movedOut} and returned the keys.${promisedLine}\n\n` +
          `I have not received my deposit back and have not been given any valid reason for keeping it. I request that you refund ${owed} to me in full by ${payBy}. If you believe you are entitled to keep any part of it, please tell me the amount and reason in writing, with supporting evidence, by the same date.\n\n` +
          `If I have not received payment by then, I will take further action to recover it, which may include an application to the NSW Civil and Administrative Tribunal. I have ${evidenceText}.\n\n` +
          sign,
      };
  }
}
