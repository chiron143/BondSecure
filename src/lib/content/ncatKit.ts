// What a student needs ready before opening NCAT's online application.
// We deliberately don't claim to map NCAT's form field-by-field: we haven't verified the
// current form. TODO (Saturday): open the NCAT online form and map these to its actual fields.

import { formatDate } from "../rules/dates";
import type { CaseFacts, Verdict } from "../rules/types";
import type { Parties } from "./letters";
import { tidyParties } from "./tidy";

export interface KitSection {
  heading: string;
  items: string[];
}

const money = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 });

export function buildNcatKit(facts: CaseFacts, verdict: Verdict, parties: Parties): KitSection[] {
  const p = tidyParties(parties);
  const where: Record<string, string> = {
    A_LODGED_BOND: "Consumer and Commercial Division – tenancy (residential proceedings)",
    B_UNLODGED_BOND: "Consumer and Commercial Division – tenancy (residential proceedings)",
    C_BOARDING_HOUSE: "Consumer and Commercial Division – boarding house (residential proceedings)",
    D_LODGER: "General Division – consumer claim, if they run a business (otherwise ask about the Local Court)",
    REFER: "Get advice first about which application to make",
  };

  const order =
    verdict.path === "A_LODGED_BOND"
      ? `An order that the rental bond of ${money(verdict.amountOwed)} be paid to me.`
      : `An order that the respondent pay me ${money(verdict.amountOwed)}, being my ${
          verdict.path === "B_UNLODGED_BOND" ? "rental bond" : "security deposit"
        }.`;

  return [
    {
      heading: "Which application",
      items: [
        where[verdict.path],
        "Apply online at ncat.nsw.gov.au, or on paper at a Tribunal registry or Service NSW centre.",
        "Fee: $62, or $16 if you're eligible for a concession (fees as at 1 July 2025; check the current schedule).",
      ],
    },
    {
      heading: "Who you're applying against (the respondent)",
      items: [
        p.landlordLegalName
          ? `${p.landlordLegalName} (you dealt with them as "${p.landlordName}"). Name the company, not the staff member you spoke to.`
          : `${p.landlordName}. Use their legal company name if they're a business: look up their ABN at abr.business.gov.au and copy the "Entity name".`,
        `Address of the property: ${p.propertyAddress}`,
      ],
    },
    {
      heading: "What you're asking for (orders sought)",
      items: [order],
    },
    {
      heading: "Your story in short (you can paste this)",
      items: [
        `I paid ${money(facts.amountPaid)}${facts.datePaid ? ` on ${formatDate(facts.datePaid)}` : ""}. I moved out on ${formatDate(facts.moveOutDate)} and returned the keys. ` +
          (verdict.amountOwed < facts.amountPaid
            ? `I have been refunded ${money(facts.amountPaid - verdict.amountOwed)}. `
            : "I have not been refunded anything. ") +
          `I sent a written demand and did not receive payment.`,
      ],
    },
    {
      heading: "Evidence to attach",
      items: [
        "Payment receipts or bank transfer records",
        "Your agreement or contract (and the operator's terms, if they promise a refund date)",
        "Your Bond Secure move-in report (PDF) with time-stamped photos",
        "Move-out photos",
        "Emails and messages, including your demand letter and any reply",
      ],
    },
    {
      heading: "What happens next",
      items: [
        "NCAT usually lists the matter for conciliation or a hearing; many cases settle at conciliation.",
        "Bring printed copies of your evidence for yourself, the respondent and the Tribunal.",
        "Get free advice before the hearing if you can (Redfern Legal Centre or your local Tenants' Advice service).",
      ],
    },
  ];
}
