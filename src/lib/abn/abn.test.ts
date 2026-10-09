import { describe, expect, it } from "vitest";
import { abrSearchUrl, formatAbn, fromDetails, fromNames, isValidAbn, legalNameWithAbn, parseJsonp } from "./abn";

describe("ABN helpers", () => {
  it("checks the ABN checksum", () => {
    expect(isValidAbn("51 824 753 556")).toBe(true); // the ATO's published example
    expect(isValidAbn("19415776361")).toBe(true); // ABR's own sample ABN
    expect(isValidAbn("51 824 753 557")).toBe(false);
    expect(isValidAbn("1234")).toBe(false);
  });

  it("formats ABNs the way the register does", () => {
    expect(formatAbn("51824753556")).toBe("51 824 753 556");
  });

  it("reads JSONP from the ABR service", () => {
    const r = parseJsonp<{ Names: unknown[] }>('callback({"Message":"","Names":[]})');
    expect(r.Names).toEqual([]);
  });

  it("normalises name search results", () => {
    const out = fromNames({
      Names: [
        { Abn: "51824753556", AbnStatus: "0000000001", Name: "Sample Rooms", State: "NSW", Postcode: "2010" },
        { Abn: "19415776361", AbnStatus: "Active", Name: "Sample Rooms Pty Ltd", State: "NSW", Postcode: "2000" },
        { Name: "no abn" },
      ],
    });
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({ abn: "19415776361", name: "Sample Rooms Pty Ltd", active: true });
  });

  it("builds the legal name line for letters and NCAT", () => {
    const m = fromDetails({ Abn: "51 824 753 556", AbnStatus: "Active", EntityName: "SAMPLE ROOMS PTY LTD", BusinessName: ["Sample Rooms"] });
    expect(m && legalNameWithAbn(m)).toBe("SAMPLE ROOMS PTY LTD (ABN 51 824 753 556)");
    expect(fromDetails({ Message: "Search text is not a valid ABN or ACN" })).toBeNull();
  });

  it("links to the public search", () => {
    expect(abrSearchUrl(" Sample Rooms ")).toBe("https://abr.business.gov.au/Search/ResultsActive?SearchText=Sample%20Rooms");
  });
});
