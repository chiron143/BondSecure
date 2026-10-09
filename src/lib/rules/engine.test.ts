import { describe, expect, it } from "vitest";
import { addBusinessDays, daysBetween, endOfMonth } from "./dates";
import { buildVerdict, classify } from "./engine";
import type { CaseFacts } from "./types";

const base: CaseFacts = {
  state: "NSW",
  who: "operator",
  agreement: "occupancy_agreement",
  residents: "5_or_more",
  bondLodged: "no",
  amountPaid: 802,
  weeklyRent: 401,
  datePaid: "2026-02-02",
  moveOutDate: "2026-08-20",
};

describe("dates", () => {
  it("skips weekends when adding business days", () => {
    // Fri 9 Oct 2026 + 1 business day = Mon 12 Oct
    expect(addBusinessDays("2026-10-09", 1)).toBe("2026-10-12");
    expect(addBusinessDays("2026-10-09", 10)).toBe("2026-10-23");
  });
  it("finds the end of the month", () => {
    expect(endOfMonth("2026-02-02")).toBe("2026-02-28");
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
  });
  it("counts days between dates", () => {
    expect(daysBetween("2026-09-03", "2026-10-09")).toBe(36);
  });
});

describe("classify", () => {
  it("lodged bond goes to Rental Bonds Online regardless of who", () => {
    expect(classify({ ...base, bondLodged: "yes" }).path).toBe("A_LODGED_BOND");
  });
  it("signed lease + not lodged = unlodged bond path", () => {
    const c = classify({ ...base, who: "real_estate_agent", agreement: "residential_tenancy_agreement" });
    expect(c.path).toBe("B_UNLODGED_BOND");
    expect(c.confidence).toBe("likely");
  });
  it("lease + not sure if lodged = unlodged path, but only 'possible'", () => {
    const c = classify({ ...base, who: "private_landlord", agreement: "residential_tenancy_agreement", bondLodged: "not_sure" });
    expect(c.path).toBe("B_UNLODGED_BOND");
    expect(c.confidence).toBe("possible");
  });
  it("operator with 5+ residents = boarding house", () => {
    expect(classify(base).path).toBe("C_BOARDING_HOUSE");
  });
  it("operator with under 5 residents = lodger", () => {
    expect(classify({ ...base, residents: "under_5" }).path).toBe("D_LODGER");
  });
  it("live-in owner = lodger", () => {
    expect(classify({ ...base, who: "live_in_owner", agreement: "nothing_written" }).path).toBe("D_LODGER");
  });
  it("university and other states are referred", () => {
    expect(classify({ ...base, who: "university" }).path).toBe("REFER");
    expect(classify({ ...base, state: "other" }).path).toBe("REFER");
  });
  it("a lease always wins over 'operator'", () => {
    expect(classify({ ...base, agreement: "residential_tenancy_agreement" }).path).toBe("B_UNLODGED_BOND");
  });
});

describe("buildVerdict", () => {
  it("boarding house: deposit due 14 days after move-out, counts days late", () => {
    const v = buildVerdict(base, "2026-10-09");
    const d = v.deadlines.find((x) => x.label.startsWith("Legal deadline"));
    expect(d?.dueDate).toBe("2026-09-03");
    expect(d?.daysOverdue).toBe(36);
    expect(v.amountOwed).toBe(802);
    expect(v.title).toContain("36 days late");
  });
  it("boarding house we're unsure about: the deadline is conditional, not stated as fact", () => {
    const v = buildVerdict({ ...base, residents: "not_sure" }, "2026-10-09");
    expect(v.confidence).toBe("possible");
    expect(v.title).toBe("If this is a boarding house, your deposit was due back on 3 September 2026, 36 days ago.");
  });
  it("boarding house: flags deposit above 2 weeks' fee", () => {
    const v = buildVerdict({ ...base, weeklyRent: 300 }, "2026-10-09");
    expect(v.flags.some((f) => f.includes("more than 2 weeks"))).toBe(true);
  });
  it("not overdue before the deadline", () => {
    const v = buildVerdict(base, "2026-08-25");
    expect(v.deadlines[0].daysOverdue).toBe(0);
  });
  it("subtracts any partial refund", () => {
    expect(buildVerdict({ ...base, amountRefunded: 200 }, "2026-10-09").amountOwed).toBe(602);
  });
  it("tracks the refund period promised in their own T&Cs", () => {
    const v = buildVerdict({ ...base, agreementRefundDays: 15 }, "2026-10-09");
    const d = v.deadlines.find((x) => x.label.includes("promised"));
    expect(d?.dueDate).toBe("2026-09-04");
    expect(d?.daysOverdue).toBe(35);
  });
  it("unlodged bond via agent: deadline is 10 business days after end of month paid", () => {
    const v = buildVerdict(
      { ...base, who: "real_estate_agent", agreement: "residential_tenancy_agreement", datePaid: "2026-02-02" },
      "2026-10-09",
    );
    expect(v.path).toBe("B_UNLODGED_BOND");
    expect(v.deadlines[0].dueDate).toBe(addBusinessDays("2026-02-28", 10));
  });
  it("tenancy bond above 4 weeks' rent is flagged", () => {
    const v = buildVerdict(
      { ...base, who: "private_landlord", agreement: "residential_tenancy_agreement", amountPaid: 2000, weeklyRent: 400 },
      "2026-10-09",
    );
    expect(v.flags.some((f) => f.includes("4 weeks"))).toBe(true);
  });
});
