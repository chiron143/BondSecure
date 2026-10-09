// The rules engine. Plain code on purpose: which law applies and whether a deadline
// has passed must be predictable and checkable, so no AI is involved here.
// Every rule used here is listed with its source in src/lib/content/sources.ts.

import { addBusinessDays, addDays, daysBetween, endOfMonth, formatDate, todayIso } from "./dates";
import type { CaseFacts, Confidence, DeadlineCheck, PathId, Verdict } from "./types";

interface Classification {
  path: PathId;
  confidence: Confidence;
  because: string[];
}

const money = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 });

export function classify(f: CaseFacts): Classification {
  const because: string[] = [];

  if (f.state !== "NSW") {
    return {
      path: "REFER",
      confidence: "likely",
      because: ["Bond Secure only covers New South Wales so far. Each state has different rules."],
    };
  }

  if (f.who === "university") {
    return {
      path: "REFER",
      confidence: "possible",
      because: [
        "University and college residences are mostly excluded from the Residential Tenancies Act, with some exceptions, so the right path depends on your contract.",
      ],
    };
  }

  // A bond lodged with NSW Fair Trading always goes through Rental Bonds Online.
  if (f.bondLodged === "yes") {
    because.push("You received a bond number from NSW Fair Trading / Rental Bonds Online, so your bond is held by the government, not the landlord.");
    return { path: "A_LODGED_BOND", confidence: "likely", because };
  }

  const tenancyLike =
    f.agreement === "residential_tenancy_agreement" ||
    ((f.who === "private_landlord" || f.who === "real_estate_agent") && f.agreement !== "occupancy_agreement");

  if (tenancyLike) {
    if (f.agreement === "residential_tenancy_agreement") {
      because.push("You signed a residential tenancy agreement (the standard NSW lease), so the Residential Tenancies Act 2010 applies.");
    } else {
      because.push("You rented from a landlord or agent, which is usually a tenancy under the Residential Tenancies Act 2010 even without a written lease.");
    }
    if (f.bondLodged === "no") {
      because.push("You never got a bond number from NSW Fair Trading, which suggests the bond was not lodged as the law requires.");
    } else {
      because.push("You're not sure the bond was lodged. Check first (see step 1); if it was, you'll claim it through Rental Bonds Online instead.");
    }
    return {
      path: "B_UNLODGED_BOND",
      confidence: f.agreement === "residential_tenancy_agreement" && f.bondLodged === "no" ? "likely" : "possible",
      because,
    };
  }

  if (f.who === "operator" || (f.who === "not_sure" && f.residents === "5_or_more")) {
    if (f.residents === "under_5") {
      because.push("The place is run as a business but has fewer than 5 residents, so it's probably not a registrable boarding house. You're likely a lodger.");
      return { path: "D_LODGER", confidence: "possible", because };
    }
    because.push(
      f.residents === "5_or_more"
        ? "A business rents out rooms to 5 or more residents, which makes it a general boarding house under the Boarding Houses Act 2012."
        : "A business rents out rooms; most of these have 5 or more residents, which would make it a boarding house. Check how many people live there.",
    );
    if (f.agreement === "occupancy_agreement") {
      because.push("You signed an occupancy agreement or licence, which is what boarding houses use.");
    }
    return {
      path: "C_BOARDING_HOUSE",
      confidence: f.residents === "5_or_more" ? "likely" : "possible",
      because,
    };
  }

  if (f.who === "live_in_owner") {
    because.push("The owner lives there and rents you a room, which usually makes you a lodger, not a tenant.");
    return { path: "D_LODGER", confidence: "likely", because };
  }

  if (f.who === "head_tenant") {
    because.push(
      "You rented from another tenant who lives there. You might be a sub-tenant (covered by the Residential Tenancies Act) or a lodger, depending on your arrangement. We'll treat you as a lodger, but get advice if you have a written lease.",
    );
    return { path: "D_LODGER", confidence: "possible", because };
  }

  return {
    path: "REFER",
    confidence: "possible",
    because: ["We couldn't tell which rules apply from your answers. A free legal service can work this out with you quickly."],
  };
}

export function buildVerdict(f: CaseFacts, today: string = todayIso()): Verdict {
  const v = buildVerdictInner(f, today);
  // Show the legal deadline first; the agreement's own promise is supporting detail.
  const promised = v.deadlines.filter((d) => d.label.includes("promised"));
  return { ...v, deadlines: [...v.deadlines.filter((d) => !d.label.includes("promised")), ...promised] };
}

function buildVerdictInner(f: CaseFacts, today: string): Verdict {
  const { path, confidence, because } = classify(f);
  const owed = Math.max(0, f.amountPaid - (f.amountRefunded ?? 0));
  const deadlines: DeadlineCheck[] = [];
  const flags: string[] = [];

  const overdue = (due: string) => Math.max(0, daysBetween(due, today));

  if (daysBetween(today, f.moveOutDate) > 0) {
    flags.push("Your move-out date is in the future. Most steps below only start once you've moved out and returned the keys.");
  }
  if (f.reasonGiven?.trim()) {
    flags.push(
      `They gave a reason ("${f.reasonGiven.trim()}"). If they're keeping money for damage or cleaning, they should show evidence such as invoices or a condition report. Your move-in report is your evidence of what was already there.`,
    );
  }
  if (f.agreementRefundDays) {
    const due = addDays(f.moveOutDate, f.agreementRefundDays);
    deadlines.push({
      label: `Refund date promised in your agreement (${f.agreementRefundDays} days)`,
      dueDate: due,
      daysOverdue: overdue(due),
    });
  }

  const base = { path, confidence, because, amountOwed: owed, deadlines, flags };

  switch (path) {
    case "A_LODGED_BOND": {
      if (f.weeklyRent && f.amountPaid > f.weeklyRent * 4) {
        flags.push(`Your bond (${money(f.amountPaid)}) is more than 4 weeks' rent (${money(f.weeklyRent * 4)}), which is above the legal maximum.`);
      }
      deadlines.push({
        label: "If your landlord claims part of the bond, you have this long to dispute it in Rental Bonds Online",
        note: "14 days from the Notice of Claim",
      });
      deadlines.push({
        label: "Latest you can apply to NCAT after the bond is paid out",
        note: "6 months from the payout date",
      });
      return {
        ...base,
        title: "Your bond is held by NSW Fair Trading. You can claim it yourself.",
        lawName: "Residential Tenancies Act 2010 (NSW)",
        summary:
          `Your ${money(owed)} isn't with your landlord; it's with NSW Fair Trading. You don't need your landlord's permission to claim it. Lodge a claim for the full amount in Rental Bonds Online. Your landlord gets 14 days' notice, and if they don't dispute it, the money is paid to you.`,
        nextSteps: [
          "Log in to Rental Bonds Online with your bond number and lodge a claim for the full amount.",
          "Send your landlord or agent the message in your claim pack so they know you've claimed and why you expect the full amount.",
          "If they claim part of it, you'll get a Notice of Claim. Dispute it in Rental Bonds Online within 14 days to freeze the bond.",
          "If it goes to NCAT, use your move-in report and the evidence list in your claim pack.",
        ],
        getHelpIf: ["Your landlord has already been paid the bond and you disagree", "You get an NCAT hearing date"],
      };
    }

    case "B_UNLODGED_BOND": {
      if (f.datePaid) {
        const due =
          f.who === "real_estate_agent"
            ? addBusinessDays(endOfMonth(f.datePaid), 10)
            : addBusinessDays(f.datePaid, 10);
        deadlines.push({
          label: "Date the bond should have been lodged with NSW Fair Trading (about)",
          dueDate: due,
          daysOverdue: overdue(due),
          note:
            f.who === "real_estate_agent"
              ? "10 business days after the end of the month you paid. Public holidays can push this out a day or two."
              : "10 business days after you paid. Public holidays can push this out a day or two.",
        });
      }
      if (f.weeklyRent && f.amountPaid > f.weeklyRent * 4) {
        flags.push(`Your bond (${money(f.amountPaid)}) is more than 4 weeks' rent (${money(f.weeklyRent * 4)}), which is above the legal maximum.`);
      }
      return {
        ...base,
        title: "Your bond should have been lodged with NSW Fair Trading. It looks like it wasn't.",
        lawName: "Residential Tenancies Act 2010 (NSW)",
        summary:
          `Landlords and agents must lodge a tenant's bond with NSW Fair Trading. Not doing so is an offence. Because it was never lodged, you can't claim it online. Instead, send a formal demand for your ${money(owed)}, and if that doesn't work, apply to NCAT for an order that it be repaid.`,
        nextSteps: [
          "Check: call NSW Fair Trading on 13 32 20 and ask whether a bond is lodged for your address. If it is, you'll use Rental Bonds Online instead.",
          "Send the demand letter in your claim pack. It gives them 7 days to pay.",
          "If they don't pay, apply to NCAT (Consumer and Commercial Division, tenancy). The fee is $62, or $16 with a concession.",
          "Attach your evidence: payment receipts, your agreement, your move-in report and move-out photos.",
        ],
        getHelpIf: [
          "You paid the bond in cash with no receipt",
          "The landlord says you weren't a tenant",
          "You get an NCAT hearing date",
        ],
      };
    }

    case "C_BOARDING_HOUSE": {
      const due = addDays(f.moveOutDate, 14);
      deadlines.push({
        label: "Legal deadline to refund your deposit",
        dueDate: due,
        daysOverdue: overdue(due),
        note: "14 days after you moved out (Boarding Houses Act 2012 occupancy principles)",
      });
      if (f.weeklyRent && f.amountPaid > f.weeklyRent * 2) {
        flags.push(
          `Your deposit (${money(f.amountPaid)}) is more than 2 weeks' fee (${money(f.weeklyRent * 2)}). Boarding house deposits can't be more than that, unless part of what you paid was rent in advance.`,
        );
      }
      const late = overdue(due);
      return {
        ...base,
        // Only state the deadline as fact when we're confident it's a boarding house.
        title:
          confidence === "possible"
            ? late > 0
              ? `If this is a boarding house, your deposit was due back on ${formatDate(due)}, ${late} day${late === 1 ? "" : "s"} ago.`
              : `If this is a boarding house, your deposit is due back by ${formatDate(due)}.`
            : late > 0
              ? `Your deposit was due back on ${formatDate(due)}. They're ${late} day${late === 1 ? "" : "s"} late.`
              : `Your deposit is due back by ${formatDate(due)}.`,
        lawName: "Boarding Houses Act 2012 (NSW)",
        summary:
          `This looks like a boarding house. The operator had to refund your ${money(owed)} deposit within 14 days of you moving out, minus only allowed deductions like unpaid rent or reasonable repair costs. Send a formal demand, and if they don't pay, apply to NCAT.`,
        nextSteps: [
          "Send the demand letter in your claim pack. It gives them 7 days to pay.",
          "If they don't pay, apply to NCAT (Consumer and Commercial Division). The fee is $62, or $16 with a concession.",
          "Use the operator's legal company name on the application. It's on their invoices or you can find it with their ABN on abr.business.gov.au.",
          "Attach your evidence: payment receipts, your agreement, your move-in report and move-out photos, and their emails.",
        ],
        getHelpIf: [
          "The operator says the Boarding Houses Act doesn't apply to them",
          "They're also claiming you owe them money",
          "You get an NCAT hearing date",
        ],
      };
    }

    case "D_LODGER": {
      const businessLandlord = f.who !== "live_in_owner" && f.who !== "head_tenant";
      return {
        ...base,
        title: "You're probably a lodger. You can still demand your deposit back.",
        lawName: businessLandlord ? "Your agreement and the Fair Trading Act 1987 (NSW)" : "Your agreement",
        summary:
          `Lodgers aren't covered by the tenancy laws, so there's no fixed legal refund deadline. But your deposit is still your money unless they can show a real reason to keep it. Send a formal demand for your ${money(owed)}. ` +
          (businessLandlord
            ? "Because they run a business, you may be able to apply to NCAT's General Division if they don't pay."
            : "If they don't pay, the usual next step is the Local Court small claims process."),
        nextSteps: [
          "Send the demand letter in your claim pack. It gives them 7 days to pay.",
          businessLandlord
            ? "If they don't pay, apply to NCAT (General Division, consumer claim). The fee is $62, or $16 with a concession, for claims up to $10,000."
            : "If they don't pay, get free advice on a Local Court small claim before you file.",
          "Keep everything in writing from now on.",
        ],
        getHelpIf: ["Before you apply to NCAT or the Local Court", "You have a written lease from the person you rented from"],
      };
    }

    case "REFER":
    default:
      return {
        ...base,
        title: "Talk to a free legal service before you act.",
        summary:
          "Your situation is outside what Bond Secure can safely guide yet. You can still use your move-in report and evidence list. A free service can tell you which rules apply in one short call.",
        nextSteps: [
          "Call Redfern Legal Centre on (02) 9698 7277 or contact your local Tenants' Advice service.",
          "Bring your payment receipts, agreement, move-in report and messages.",
        ],
        getHelpIf: ["Now"],
      };
  }
}
