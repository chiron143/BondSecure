// Shows the working behind a verdict: which rules (with sources and dates) it used, and
// what would change if a "not sure" answer went the other way. Plain code, like the
// engine: the what-ifs are the engine itself re-run on the other possible answers.

import { SOURCES, type Source } from "../content/sources";
import { classify } from "./engine";
import type { CaseFacts, PathId } from "./types";

export const PATH_LABEL: Record<PathId, string> = {
  A_LODGED_BOND: "Bond held by NSW Fair Trading: claim it in Rental Bonds Online",
  B_UNLODGED_BOND: "Residential tenancy, bond never lodged: demand, then NCAT",
  C_BOARDING_HOUSE: "Boarding house: 14-day refund rule, demand, then NCAT",
  D_LODGER: "Lodger: no fixed deadline, demand, then NCAT or Local Court",
  REFER: "Outside what we can safely guide: get free legal advice first",
};

/** The rules each path relies on, by id in SOURCES. */
const PATH_SOURCES: Record<PathId, string[]> = {
  A_LODGED_BOND: ["rbo-claim", "rbo-dispute", "rta-bond-max"],
  B_UNLODGED_BOND: ["rta-lodgement", "rta-bond-max", "ncat-fee"],
  C_BOARDING_HOUSE: ["boarding-definition", "boarding-deposit", "ncat-fee"],
  D_LODGER: ["lodgers", "ncat-fee"],
  REFER: ["lodgers"],
};

export interface WhatIf {
  /** e.g. "If fewer than 5 people live there" */
  condition: string;
  path: PathId;
}

export interface Explanation {
  sources: Source[];
  whatIfs: WhatIf[];
  /** True when the student should talk to a free legal service before acting on this. */
  checkWithAService: boolean;
}

// For each answer a student can leave as "not sure", the other answers to try.
const VARIANTS: { applies: (f: CaseFacts) => boolean; tries: { condition: string; patch: Partial<CaseFacts> }[] }[] = [
  {
    applies: (f) => f.residents === "not_sure",
    tries: [
      { condition: "If 5 or more people live there", patch: { residents: "5_or_more" } },
      { condition: "If fewer than 5 people live there", patch: { residents: "under_5" } },
    ],
  },
  {
    applies: (f) => f.bondLodged === "not_sure",
    tries: [
      { condition: "If NSW Fair Trading does have your bond", patch: { bondLodged: "yes" } },
      { condition: "If your bond was never lodged with Fair Trading", patch: { bondLodged: "no" } },
    ],
  },
  {
    applies: (f) => f.agreement === "not_sure",
    tries: [
      { condition: "If you signed a standard NSW residential tenancy agreement", patch: { agreement: "residential_tenancy_agreement" } },
      { condition: "If you signed an occupancy agreement or licence", patch: { agreement: "occupancy_agreement" } },
    ],
  },
  {
    applies: (f) => f.who === "not_sure",
    tries: [
      { condition: "If a company runs the rooms as a business", patch: { who: "operator" } },
      { condition: "If you rented from a private landlord", patch: { who: "private_landlord" } },
      { condition: "If the owner lives there with you", patch: { who: "live_in_owner" } },
    ],
  },
];

export function explain(f: CaseFacts): Explanation {
  const current = classify(f);
  const whatIfs: WhatIf[] = [];
  for (const v of VARIANTS) {
    if (!v.applies(f)) continue;
    for (const t of v.tries) {
      const path = classify({ ...f, ...t.patch }).path;
      if (path !== current.path && !whatIfs.some((w) => w.path === path)) whatIfs.push({ condition: t.condition, path });
    }
  }
  const sources = PATH_SOURCES[current.path]
    .map((id) => SOURCES.find((s) => s.id === id))
    .filter((s): s is Source => Boolean(s));
  return {
    sources,
    whatIfs,
    checkWithAService: current.path === "REFER" || current.confidence === "possible" || whatIfs.length > 0,
  };
}
