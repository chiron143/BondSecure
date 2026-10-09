// Cleans up what people type on a phone before it goes into a formal letter or form:
// "510 , cleveland street ,  surry hills " -> "510, cleveland street, surry hills".

import type { Parties } from "./letters";

export const tidyText = (s: string) =>
  s.replace(/\s+/g, " ").replace(/\s+([,.;:)])/g, "$1").replace(/\(\s+/g, "(").trim();

const opt = (s?: string) => (s === undefined ? undefined : tidyText(s) || undefined);

export function tidyParties(p: Parties): Parties {
  return {
    ...p,
    studentName: tidyText(p.studentName),
    studentEmail: opt(p.studentEmail),
    studentPhone: opt(p.studentPhone),
    propertyAddress: tidyText(p.propertyAddress),
    landlordName: tidyText(p.landlordName),
    landlordLegalName: opt(p.landlordLegalName),
  };
}
