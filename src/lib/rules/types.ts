// Facts the student gives us in the "I didn't get my bond back" intake.
// Every field is optional-ish on purpose: real people answer "not sure".

export type Who =
  | "private_landlord" // a landlord renting directly, no agent
  | "real_estate_agent" // a real estate agent manages the place
  | "operator" // a company running rooms / student accommodation / co-living
  | "university" // a university or college residence
  | "head_tenant" // another tenant who lives there and sublets a room
  | "live_in_owner" // the owner lives there and rents a room
  | "not_sure";

export type Agreement =
  | "residential_tenancy_agreement" // the standard NSW lease
  | "occupancy_agreement" // occupancy agreement / licence / house rules
  | "nothing_written"
  | "not_sure";

export type Residents = "under_5" | "5_or_more" | "not_sure";

export type YesNoUnsure = "yes" | "no" | "not_sure";

export interface CaseFacts {
  state: "NSW" | "other";
  who: Who;
  agreement: Agreement;
  residents: Residents;
  /** Did they get an email/SMS from NSW Fair Trading or Rental Bonds Online with a bond number? */
  bondLodged: YesNoUnsure;
  /** Total bond / deposit paid, AUD */
  amountPaid: number;
  /** Rent or occupancy fee per week, AUD (used for the legal maximum checks) */
  weeklyRent?: number;
  /** ISO date the bond/deposit was paid */
  datePaid?: string;
  /** ISO date they moved out and handed back keys */
  moveOutDate: string;
  /** Amount already refunded to them, AUD */
  amountRefunded?: number;
  /** What the landlord/operator said, if anything */
  reasonGiven?: string;
  /** Refund period promised in their own agreement or T&Cs, in days (e.g. 15) */
  agreementRefundDays?: number;
}

export type PathId =
  | "A_LODGED_BOND" // bond is with NSW Fair Trading -> Rental Bonds Online claim
  | "B_UNLODGED_BOND" // tenancy, but bond never lodged -> demand + NCAT
  | "C_BOARDING_HOUSE" // registrable boarding house deposit -> demand + NCAT
  | "D_LODGER" // boarder/lodger not in a boarding house -> demand + NCAT General Division / Local Court
  | "REFER"; // outside what we can safely guide (other state, uni college, too unclear)

export type Confidence = "likely" | "possible";

export interface DeadlineCheck {
  label: string;
  dueDate?: string; // ISO
  daysOverdue?: number; // > 0 means overdue
  note?: string;
}

export interface Verdict {
  path: PathId;
  confidence: Confidence;
  title: string;
  /** Plain-language explanation of which rules apply and why we think so */
  summary: string;
  /** Why we classified it this way (shown so people can check our reasoning) */
  because: string[];
  lawName?: string;
  amountOwed: number;
  deadlines: DeadlineCheck[];
  /** Things that look wrong beyond the late refund (e.g. bond above the legal maximum) */
  flags: string[];
  nextSteps: string[];
  /** When to stop using the app and get a human */
  getHelpIf: string[];
}
