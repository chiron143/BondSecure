import "server-only";

// Server-side Gemini calls. NOT YET TESTED against the live API (the build workspace
// couldn't reach Google). Step 1 in SPEC.md is to prove this works end to end.
//
// Upload plan (avoids Vercel's ~4.5 MB request body limit):
//   1. Browser asks /api/video/start-upload for an upload URL (server starts a Gemini
//      resumable upload with the API key, returns only the session URL).
//   2. Browser sends the video bytes straight to that URL. The key never reaches the browser.
//   3. Browser calls /api/video/analyse with the file name; server waits for ACTIVE and
//      asks Gemini for the structured analysis.
// If step 2 is blocked by CORS in the browser, fall back to Vercel Blob client uploads
// and have the server stream the blob into Gemini (see SPEC.md, "Fallbacks").

import { GoogleGenAI, MediaResolution, createPartFromUri, type Part } from "@google/genai";
import type { MoveInAnalysis } from "../movein/types";
import { MOVE_IN_PROMPT, MOVE_IN_SCHEMA } from "./prompts";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
// If the main model is overloaded (503) or rate-limited (429), try these in order.
// (gemini-3.7-flash currently serves 3.8 under the hood, so it's no use as a fallback.)
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.6-flash,gemini-3.5-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const busy = (e: unknown) => {
  const status = (e as { status?: number }).status;
  const msg = String((e as Error)?.message ?? "");
  return status === 429 || status === 500 || status === 503 || /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded/i.test(msg);
};

/**
 * Runs a Gemini call, moving straight on to the next Flash model when Google says it's
 * overloaded (a busy model rarely recovers within seconds, and serverless time is
 * limited). One last short retry on the final model. Other errors fail straight away.
 */
export async function withModelFallback<T>(call: (model: string) => Promise<T>): Promise<T> {
  const models = [GEMINI_MODEL, ...FALLBACK_MODELS.filter((m) => m !== GEMINI_MODEL)];
  let last: unknown;
  for (const [n, model] of models.entries()) {
    for (const wait of n === models.length - 1 ? [0, 3000] : [0]) {
      if (wait) await new Promise((r) => setTimeout(r, wait));
      try {
        return await call(model);
      } catch (e) {
        last = e;
        if (!busy(e)) throw friendly(e);
        console.warn(`Gemini ${model} busy, retrying or falling back`);
      }
    }
  }
  throw new Error("Google's AI is very busy right now. Wait a minute and try again, or continue with the demo.", { cause: last });
}

/** Turns the SDK's raw JSON errors into a sentence a student can read. */
function friendly(e: unknown): Error {
  const msg = String((e as Error)?.message ?? e);
  const inner = msg.match(/"message"\s*:\s*"([^"]+)"/)?.[1];
  return new Error(inner ?? msg, { cause: e });
}
const BASE = "https://generativelanguage.googleapis.com";

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function key(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set");
  return k;
}

/** Starts a resumable upload and returns the one-time upload URL for the browser. */
export async function startResumableUpload(sizeBytes: number, mimeType: string, displayName: string, origin?: string | null) {
  const res = await fetch(`${BASE}/upload/v1beta/files`, {
    method: "POST",
    headers: {
      // Google's resumable uploads allow CORS for the origin that started the session,
      // so pass the browser's origin through.
      ...(origin ? { Origin: origin } : {}),
      "x-goog-api-key": key(),
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(sizeBytes),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  });
  const uploadUrl = res.headers.get("x-goog-upload-url");
  if (!res.ok || !uploadUrl) {
    throw new Error(`Gemini upload start failed: ${res.status} ${await res.text()}`);
  }
  return uploadUrl;
}

/** Waits until an uploaded file has finished processing. */
export async function waitUntilActive(fileName: string, timeoutMs = 120_000) {
  const ai = new GoogleGenAI({ apiKey: key() });
  const start = Date.now();
  for (;;) {
    const f = await ai.files.get({ name: fileName });
    if (f.state === "ACTIVE") return f;
    if (f.state === "FAILED") throw new Error("Gemini couldn't process this video.");
    if (Date.now() - start > timeoutMs) throw new Error("Gemini took too long to process the video.");
    await new Promise((r) => setTimeout(r, 2000));
  }
}

export async function analyseMoveInVideo(fileName: string): Promise<MoveInAnalysis> {
  const ai = new GoogleGenAI({ apiKey: key() });
  try {
    const file = await waitUntilActive(fileName);
    if (!file.uri || !file.mimeType) throw new Error("Uploaded file has no URI.");

    const video = createPartFromUri(file.uri, file.mimeType);
    // Sample 2 frames/second so small marks aren't skipped (default is 1 fps).
    video.videoMetadata = { fps: 2 };

    return await withModelFallback(async (model) => {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [video, { text: MOVE_IN_PROMPT }] }],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: MOVE_IN_SCHEMA,
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
          temperature: 0.2,
        },
      });
      return parseJson<MoveInAnalysis>(res.text);
    });
  } finally {
    // Uploaded files expire after 48 hours anyway; delete now for privacy, even on failure.
    // Awaited so a serverless function doesn't stop before the delete is sent.
    await ai.files.delete({ name: fileName }).catch(() => {});
  }
}

function parseJson<T>(text: string | undefined): T {
  if (!text) throw new Error("Gemini returned an empty answer.");
  // Some models wrap JSON in a code fence even in JSON mode.
  return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;
}

/** One structured call: some inline parts (images, PDFs) plus a prompt, JSON out. */
export async function generateJson<T>(parts: Part[], prompt: string, schema: object, temperature = 0.1): Promise<T> {
  const ai = new GoogleGenAI({ apiKey: key() });
  return withModelFallback(async (model) => {
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [...parts, { text: prompt }] }],
      config: { responseMimeType: "application/json", responseJsonSchema: schema, temperature },
    });
    return parseJson<T>(res.text);
  });
}
