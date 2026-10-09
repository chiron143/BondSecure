// What the AI found in the student's receipts, emails and agreement.
// These are suggestions only: the student ticks which ones to use, and the rules engine
// still makes every decision from the confirmed answers.

export type EvidenceField =
  | "amountPaid"
  | "weeklyRent"
  | "datePaid"
  | "moveOutDate"
  | "amountRefunded"
  | "agreementRefundDays"
  | "reasonGiven"
  | "landlordName"
  | "landlordLegalName"
  | "propertyAddress"
  | "studentName"
  | "studentEmail"
  | "agreementType"
  | "bondNumber";

export interface EvidenceFinding {
  field: EvidenceField;
  /** Normalised value: numbers as plain digits, dates as YYYY-MM-DD */
  value: string;
  /** The exact words in the document this came from, so the student can check it */
  quote: string;
  /** Which uploaded file it came from */
  document: string;
}

export interface EvidenceDocument {
  document: string;
  kind: "receipt" | "agreement" | "email" | "message" | "bank_statement" | "other";
  summary: string;
}

export interface EvidenceExtraction {
  documents: EvidenceDocument[];
  findings: EvidenceFinding[];
  demo?: boolean;
}

export const FIELD_LABEL: Record<EvidenceField, string> = {
  amountPaid: "Bond or deposit paid",
  weeklyRent: "Rent per week",
  datePaid: "Date you paid it",
  moveOutDate: "Date you moved out",
  amountRefunded: "Already refunded",
  agreementRefundDays: "Refund period in their terms",
  reasonGiven: "What they told you",
  landlordName: "Who you paid",
  landlordLegalName: "Their company name",
  propertyAddress: "Address of the place",
  studentName: "Your name",
  studentEmail: "Your email",
  agreementType: "What you signed",
  bondNumber: "Bond number from NSW Fair Trading",
};
