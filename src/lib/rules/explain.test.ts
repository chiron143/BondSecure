import { describe, expect, it } from "vitest";
import { SOURCES } from "../content/sources";
import { classify } from "./engine";
import { EXAMPLE_CASES } from "./examples";
import { explain } from "./explain";
import type { CaseFacts } from "./types";

const base: CaseFacts = {
  state: "NSW",
  who: "operator",
  agreement: "occupancy_agreement",
  residents: "5_or_more",
  bondLodged: "no",
  amountPaid: 802,
  moveOutDate: "2026-08-20",
};

describe("explain", () => {
  it("a clear boarding-house case cites its rules and needs no what-ifs", () => {
    const e = explain(base);
    expect(e.sources.map((s) => s.id)).toEqual(["boarding-definition", "boarding-deposit", "ncat-fee"]);
    expect(e.whatIfs).toEqual([]);
    expect(e.checkWithAService).toBe(false);
  });

  it("not sure how many live there: shows it could be a lodger instead, and says to check", () => {
    const e = explain({ ...base, residents: "not_sure" });
    expect(e.whatIfs).toEqual([{ condition: "If fewer than 5 people live there", path: "D_LODGER" }]);
    expect(e.checkWithAService).toBe(true);
  });

  it("not sure the bond was lodged under a lease: shows the Rental Bonds Online path", () => {
    const e = explain({ ...base, who: "private_landlord", agreement: "residential_tenancy_agreement", bondLodged: "not_sure" });
    expect(e.whatIfs.map((w) => w.path)).toContain("A_LODGED_BOND");
  });

  it("not sure who they rented from: lists every different outcome once", () => {
    const e = explain({ ...base, who: "not_sure", agreement: "nothing_written", residents: "not_sure" });
    const paths = e.whatIfs.map((w) => w.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.length).toBeGreaterThan(1);
  });

  it("every path cites sources that exist", () => {
    for (const f of [base, { ...base, bondLodged: "yes" as const }, { ...base, who: "university" as const }, { ...base, who: "live_in_owner" as const }]) {
      const e = explain(f);
      expect(e.sources.length).toBeGreaterThan(0);
      for (const s of e.sources) expect(SOURCES).toContain(s);
    }
  });

  it("refer cases always send people to a legal service", () => {
    expect(explain({ ...base, state: "other" }).checkWithAService).toBe(true);
  });
});

describe("example cases say what the engine actually does", () => {
  const expected: Record<string, string> = {
    typical: "C_BOARDING_HOUSE",
    "lease-beats-operator": "B_UNLODGED_BOND",
    "lodged-beats-boarding": "A_LODGED_BOND",
    "unsure-residents": "C_BOARDING_HOUSE",
    "head-tenant": "D_LODGER",
    "uni-college": "REFER",
  };
  for (const c of EXAMPLE_CASES) {
    it(c.label, () => {
      const f = { ...c.facts, moveOutDate: "2026-08-20" };
      expect(classify(f).path).toBe(expected[c.id]);
      if (c.kind !== "typical") expect(explain(f).checkWithAService || c.id.includes("beats")).toBe(true);
    });
  }
});
