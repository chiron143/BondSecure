// The move-in PDF carries its own data as an embedded attachment, so months later the
// student can upload the same PDF into the recovery flow and their evidence comes back:
// no account or database needed. The visible pages stay the human-readable record.

import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, PDFString, PDFHexString, decodePDFRawStream } from "pdf-lib";
import type { MoveInReport } from "../movein/types";

const FILE_NAME = "bond-secure-move-in.json";
const FORMAT = "bond-secure/move-in";

interface Envelope {
  format: typeof FORMAT;
  version: 1;
  report: MoveInReport;
}

export async function attachReportData(pdf: PDFDocument, report: MoveInReport) {
  const envelope: Envelope = { format: FORMAT, version: 1, report };
  await pdf.attach(new TextEncoder().encode(JSON.stringify(envelope)), FILE_NAME, {
    mimeType: "application/json",
    description: "Bond Secure move-in report data (lets you load this report back into Bond Secure)",
    creationDate: new Date(report.createdAt),
    modificationDate: new Date(report.createdAt),
  });
}

function isReport(r: unknown): r is MoveInReport {
  const x = r as MoveInReport;
  return Boolean(
    x && typeof x.moveInDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.moveInDate) &&
      typeof x.propertyAddress === "string" && Array.isArray(x.items) &&
      typeof x.video?.sha256 === "string" && /^[0-9a-f]{64}$/.test(x.video.sha256),
  );
}

/** Reads the report back out of a Bond Secure move-in PDF, or null if it has none. */
export async function readReportData(bytes: Uint8Array | ArrayBuffer): Promise<MoveInReport | null> {
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
  } catch {
    return null;
  }
  const names = pdf.catalog.lookupMaybe(PDFName.of("Names"), PDFDict);
  const files = names?.lookupMaybe(PDFName.of("EmbeddedFiles"), PDFDict);
  const list = files?.lookupMaybe(PDFName.of("Names"), PDFArray);
  if (!list) return null;

  for (let i = 0; i + 1 < list.size(); i += 2) {
    const name = list.lookup(i);
    const label = name instanceof PDFString || name instanceof PDFHexString ? name.decodeText() : "";
    if (label !== FILE_NAME) continue;
    try {
      const spec = list.lookup(i + 1, PDFDict);
      const stream = spec.lookup(PDFName.of("EF"), PDFDict).lookup(PDFName.of("F"));
      if (!(stream instanceof PDFRawStream)) return null;
      const env = JSON.parse(new TextDecoder().decode(decodePDFRawStream(stream).decode())) as Envelope;
      if (env.format === FORMAT && isReport(env.report)) return env.report;
    } catch {
      return null;
    }
  }
  return null;
}
