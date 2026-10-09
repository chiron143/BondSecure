import { hasGeminiKey, startResumableUpload } from "@/lib/ai/gemini";

// POST { sizeBytes, mimeType, name } -> { uploadUrl } | { demo: true }
export async function POST(request: Request) {
  if (!hasGeminiKey()) {
    return Response.json({ demo: true, reason: "No GEMINI_API_KEY set, using demo analysis." });
  }
  const { sizeBytes, mimeType, name } = await request.json();
  if (!sizeBytes || !mimeType?.startsWith("video/")) {
    return Response.json({ error: "Send a video file." }, { status: 400 });
  }
  if (sizeBytes > 2 * 1024 * 1024 * 1024) {
    return Response.json({ error: "That video is over 2 GB. Film a shorter walk-through." }, { status: 400 });
  }
  try {
    const uploadUrl = await startResumableUpload(sizeBytes, mimeType, String(name ?? "move-in-video"));
    return Response.json({ uploadUrl });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
