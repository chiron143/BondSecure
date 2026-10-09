// Demo mode for the evidence reader: a canned result, always labelled "demo" in the UI.
// Uses the same sample operator name as the rest of the demo ("Sample Rooms").

import type { EvidenceExtraction } from "./types";

export function demoExtraction(fileNames: string[]): EvidenceExtraction {
  const receipt = fileNames[0] ?? "receipt.png";
  const terms = fileNames[1] ?? receipt;
  const email = fileNames[2] ?? terms;
  return {
    demo: true,
    documents: [
      { document: receipt, kind: "receipt", summary: "Payment receipt for a security deposit and first week's rent." },
      { document: terms, kind: "agreement", summary: "Occupancy agreement with a refund clause." },
      { document: email, kind: "email", summary: "Reply from the building manager about the refund." },
    ],
    findings: [
      { field: "amountPaid", value: "802", quote: "Security deposit ............ $802.00", document: receipt },
      { field: "datePaid", value: "2026-02-02", quote: "Paid 02/02/2026", document: receipt },
      { field: "weeklyRent", value: "401", quote: "Weekly fee $401.00", document: terms },
      { field: "landlordName", value: "Sample Rooms", quote: "Sample Rooms Pty Ltd trading as Sample Rooms", document: terms },
      { field: "landlordLegalName", value: "Sample Rooms Pty Ltd", quote: "Sample Rooms Pty Ltd trading as Sample Rooms", document: terms },
      { field: "agreementType", value: "occupancy_agreement", quote: "OCCUPANCY AGREEMENT", document: terms },
      { field: "agreementRefundDays", value: "15", quote: "The deposit will be refunded within 15 days of check-out", document: terms },
      { field: "reasonGiven", value: "It's still being processed", quote: "Your refund is still being processed, please be patient", document: email },
    ],
  };
}
