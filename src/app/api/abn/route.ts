import {
  abrSearchUrl,
  digitsOnly,
  fromDetails,
  fromNames,
  isValidAbn,
  parseJsonp,
  type AbrDetailsResponse,
  type AbrNamesResponse,
} from "@/lib/abn/abn";

// GET /api/abn?q=<name or ABN> -> { matches: AbnMatch[], searchUrl } | { configured: false, searchUrl }
// Uses the free ABN Lookup JSON service. The GUID (ABR_GUID) stays on the server.
const ABR = "https://abr.business.gov.au/json";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 200);
  if (q.length < 2) return Response.json({ error: "Type a name or ABN." }, { status: 400 });
  const searchUrl = abrSearchUrl(q);

  const guid = process.env.ABR_GUID;
  if (!guid) return Response.json({ configured: false, searchUrl });

  try {
    if (isValidAbn(q)) {
      const url = `${ABR}/AbnDetails.aspx?abn=${digitsOnly(q)}&callback=c&guid=${encodeURIComponent(guid)}`;
      const r = parseJsonp<AbrDetailsResponse>(await (await fetch(url)).text());
      const m = fromDetails(r);
      return Response.json({ matches: m ? [m] : [], message: m ? undefined : r.Message, searchUrl });
    }
    const url = `${ABR}/MatchingNames.aspx?name=${encodeURIComponent(q)}&maxResults=10&callback=c&guid=${encodeURIComponent(guid)}`;
    const r = parseJsonp<AbrNamesResponse>(await (await fetch(url)).text());
    // Students rent in NSW, so show NSW businesses first.
    const matches = fromNames(r).sort((a, b) => Number(b.state === "NSW") - Number(a.state === "NSW"));
    return Response.json({ matches, message: r.Message || undefined, searchUrl });
  } catch {
    return Response.json({ error: "The ABN register didn't answer. Try the link instead.", searchUrl }, { status: 502 });
  }
}
