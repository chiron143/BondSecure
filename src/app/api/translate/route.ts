import { generateJson, hasGeminiKey } from "@/lib/ai/gemini";
import { TRANSLATE_SCHEMA, translatePrompt } from "@/lib/ai/prompts";
import { LANGUAGES } from "@/lib/content/languages";

// Room for falling back to other models when Gemini is overloaded.
export const maxDuration = 300;

// POST { language: "hi", texts: string[] } -> { translations: string[] }
// Only the plain-language explanation is translated. The letter always stays in English.
export async function POST(request: Request) {
  if (!hasGeminiKey()) {
    return Response.json({ error: "Translation needs AI, which isn't switched on here." }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as { language?: string; texts?: unknown } | null;
  const lang = LANGUAGES.find((l) => l.code === body?.language);
  const texts = body?.texts;
  if (!lang || lang.code === "en") return Response.json({ error: "Pick a language." }, { status: 400 });
  if (!Array.isArray(texts) || !texts.every((t) => typeof t === "string") || texts.length > 80) {
    return Response.json({ error: "Nothing to translate." }, { status: 400 });
  }
  if (texts.join("").length > 20_000) return Response.json({ error: "Too much text." }, { status: 413 });

  try {
    const out = await generateJson<{ translations: string[] }>(
      [{ text: JSON.stringify(texts) }],
      translatePrompt(lang.english),
      TRANSLATE_SCHEMA,
      0.2,
    );
    if (out.translations?.length !== texts.length) throw new Error("The translation came back incomplete. Try again.");
    return Response.json(out);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
