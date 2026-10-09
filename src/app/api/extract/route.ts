import type { Part } from "@google/genai";
import { generateJson, hasGeminiKey } from "@/lib/ai/gemini";
import { EVIDENCE_PROMPT, EVIDENCE_SCHEMA } from "@/lib/ai/prompts";
import { demoExtraction } from "@/lib/evidence/demo";
import type { EvidenceExtraction } from "@/lib/evidence/types";

export const maxDuration = 60;

const ALLOWED = /^(image\/(png|jpeg|webp|heic|heif)|application\/pdf|text\/plain)$/;
// Vercel caps request bodies at about 4.5 MB; the browser shrinks images before sending.
const MAX_BASE64 = 4_200_000;

interface InFile {
  name: string;
  mimeType: string;
  data: string; // base64, no data: prefix
}

// POST { files: InFile[], demo?: boolean } -> EvidenceExtraction
// Nothing is stored: files go to Gemini inline for this one request and are not kept.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { files?: InFile[]; demo?: boolean } | null;
  const files = body?.files ?? [];
  if (!files.length) return Response.json({ error: "Add at least one file." }, { status: 400 });
  if (files.length > 8) return Response.json({ error: "Up to 8 files at a time." }, { status: 400 });
  if (files.some((f) => typeof f.data !== "string" || !ALLOWED.test(f.mimeType))) {
    return Response.json({ error: "Use screenshots or photos (PNG, JPG) or PDFs." }, { status: 400 });
  }
  if (files.reduce((n, f) => n + f.data.length, 0) > MAX_BASE64) {
    return Response.json({ error: "Those files are too big together. Try fewer, or screenshots instead of PDFs." }, { status: 413 });
  }

  if (body?.demo || !hasGeminiKey()) {
    return Response.json(demoExtraction(files.map((f) => f.name)));
  }

  const parts: Part[] = files.flatMap((f) => [
    { text: `FILE: ${f.name}` },
    { inlineData: { mimeType: f.mimeType, data: f.data } },
  ]);
  try {
    const out = await generateJson<EvidenceExtraction>(parts, EVIDENCE_PROMPT, EVIDENCE_SCHEMA);
    return Response.json({ documents: out.documents ?? [], findings: out.findings ?? [] } satisfies EvidenceExtraction);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
