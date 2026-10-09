// ABN helpers for finding the operator's legal name on the Australian Business Register.
// NCAT applications and demand letters should name the legal entity (e.g. "Example Pty Ltd"),
// not the trading name students know. Pure code: shared by the API route and the browser.

const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export const digitsOnly = (s: string) => s.replace(/\D/g, "");

/** The ATO's ABN checksum: subtract 1 from the first digit, weight, sum, divisible by 89. */
export function isValidAbn(input: string): boolean {
  const d = digitsOnly(input);
  if (d.length !== 11) return false;
  const sum = [...d].reduce((acc, c, i) => acc + (Number(c) - (i === 0 ? 1 : 0)) * WEIGHTS[i], 0);
  return sum % 89 === 0;
}

export function formatAbn(input: string): string {
  const d = digitsOnly(input);
  return d.length === 11 ? `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}` : input;
}

/** Public ABN Lookup search, for when we can't call the API (no GUID) or the student wants to check. */
export const abrSearchUrl = (name: string) =>
  `https://abr.business.gov.au/Search/ResultsActive?SearchText=${encodeURIComponent(name.trim())}`;
export const abrAbnUrl = (abn: string) => `https://abr.business.gov.au/ABN/View?abn=${digitsOnly(abn)}`;

export interface AbnMatch {
  abn: string; // 11 digits
  name: string; // the name that matched (may be a business/trading name)
  legalName?: string; // the registered entity name, when known
  state?: string;
  postcode?: string;
  active: boolean;
}

/** The ABR JSON service answers with JSONP: callback({...}). */
export function parseJsonp<T>(text: string): T {
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  return JSON.parse(start >= 0 && end > start ? text.slice(start + 1, end) : text) as T;
}

interface AbrName {
  Abn?: string;
  AbnStatus?: string;
  IsCurrent?: boolean;
  Name?: string;
  State?: string;
  Postcode?: string;
}
export interface AbrNamesResponse {
  Message?: string;
  Names?: AbrName[];
}
export interface AbrDetailsResponse {
  Message?: string;
  Abn?: string;
  AbnStatus?: string;
  EntityName?: string;
  BusinessName?: string[];
  AddressState?: string;
  AddressPostcode?: string;
}

export function fromNames(r: AbrNamesResponse): AbnMatch[] {
  return (r.Names ?? [])
    .filter((n) => n.Abn && n.Name)
    .map((n) => ({
      abn: digitsOnly(n.Abn!),
      name: n.Name!.trim(),
      state: n.State || undefined,
      postcode: n.Postcode || undefined,
      active: (n.AbnStatus ?? "").toLowerCase().startsWith("active"),
    }));
}

export function fromDetails(r: AbrDetailsResponse): AbnMatch | null {
  if (!r.Abn || !r.EntityName) return null;
  return {
    abn: digitsOnly(r.Abn),
    name: r.BusinessName?.[0] ?? r.EntityName,
    legalName: r.EntityName.trim(),
    state: r.AddressState || undefined,
    postcode: r.AddressPostcode || undefined,
    active: (r.AbnStatus ?? "").toLowerCase().startsWith("active"),
  };
}

/** What goes in the letter and on the NCAT form, e.g. "Example Pty Ltd (ABN 51 824 753 556)". */
export const legalNameWithAbn = (m: AbnMatch) => `${m.legalName ?? m.name} (ABN ${formatAbn(m.abn)})`;
