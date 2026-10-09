// Worked example cases: one typical, several non-obvious, one out of scope. Used by the
// intake ("try an example") and by /how-it-decides, where each is run through the real
// engine so the page shows the engine's actual answer, not a description of it.
// Sample names only ("Sample Rooms" is not a real operator).

import type { Parties } from "../content/letters";
import type { CaseFacts } from "./types";

export interface ExampleCase {
  id: string;
  kind: "typical" | "tricky" | "out of scope";
  label: string;
  /** Why this one is interesting, in one sentence */
  lesson: string;
  facts: Omit<CaseFacts, "moveOutDate">;
}

const common = {
  state: "NSW" as const,
  amountPaid: 802,
  weeklyRent: 401,
  datePaid: "2026-02-02",
  agreementRefundDays: 15,
  reasonGiven: "It's still being processed",
};

export const EXAMPLE_CASES: ExampleCase[] = [
  {
    id: "typical",
    kind: "typical",
    label: "Student accommodation, deposit weeks late",
    lesson: "A company renting rooms to 5 or more people is a boarding house, so the 14-day refund rule applies.",
    facts: { ...common, who: "operator", agreement: "occupancy_agreement", residents: "5_or_more", bondLodged: "no" },
  },
  {
    id: "lease-beats-operator",
    kind: "tricky",
    label: "Student accommodation, but you signed a standard lease",
    lesson: "The agreement decides, not the type of building: a standard NSW lease means the Residential Tenancies Act applies, and the bond had to be lodged with Fair Trading.",
    facts: { ...common, who: "operator", agreement: "residential_tenancy_agreement", residents: "5_or_more", bondLodged: "no" },
  },
  {
    id: "lodged-beats-boarding",
    kind: "tricky",
    label: "Rooms run by a company, but you got a Fair Trading bond number",
    lesson: "If Fair Trading holds the bond, you claim it yourself in Rental Bonds Online, whatever kind of place it is.",
    facts: { ...common, who: "operator", agreement: "occupancy_agreement", residents: "5_or_more", bondLodged: "yes" },
  },
  {
    id: "unsure-residents",
    kind: "tricky",
    label: "Not sure how many people live there",
    lesson: "Fewer than 5 residents would make you a lodger with no fixed refund deadline, so we show both answers and tell you to check first.",
    facts: { ...common, who: "operator", agreement: "occupancy_agreement", residents: "not_sure", bondLodged: "no" },
  },
  {
    id: "head-tenant",
    kind: "tricky",
    label: "Rented a room from another tenant who lives there",
    lesson: "You could be a sub-tenant or a lodger depending on the arrangement, so we treat it as uncertain and point you to free advice.",
    facts: { ...common, who: "head_tenant", agreement: "nothing_written", residents: "under_5", bondLodged: "no" },
  },
  {
    id: "uni-college",
    kind: "out of scope",
    label: "University college residence",
    lesson: "Colleges are mostly excluded from the tenancy laws with exceptions, so we don't guess: we refer you to a free legal service.",
    facts: { ...common, who: "university", agreement: "occupancy_agreement", residents: "5_or_more", bondLodged: "no" },
  },
];

export const EXAMPLE_PARTIES: Parties = {
  studentName: "Priya Sharma",
  studentEmail: "priya@example.com",
  propertyAddress: "Room 12, 100 Example Street, Surry Hills NSW 2010",
  landlordName: "Sample Rooms",
};
