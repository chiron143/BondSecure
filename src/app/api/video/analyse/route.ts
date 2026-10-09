import { analyseMoveInVideo, hasGeminiKey } from "@/lib/ai/gemini";

// Video analysis can take a while. Raise this if Vercel's plan allows more.
export const maxDuration = 300;

// POST { fileName: "files/abc123" } -> MoveInAnalysis
export async function POST(request: Request) {
  if (!hasGeminiKey()) {
    return Response.json({ error: "No GEMINI_API_KEY set." }, { status: 503 });
  }
  const { fileName } = await request.json();
  if (typeof fileName !== "string" || !fileName.startsWith("files/")) {
    return Response.json({ error: "Missing fileName." }, { status: 400 });
  }
  try {
    return Response.json(await analyseMoveInVideo(fileName));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
