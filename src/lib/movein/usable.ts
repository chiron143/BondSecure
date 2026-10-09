// A move-in report only counts as "already there when I moved in" evidence if it was made
// before the student moved out. A report dated after move-out (another room, or a test)
// must never be presented to a landlord or NCAT as move-in evidence.

import type { CaseFacts } from "../rules/types";
import type { MoveInReport } from "./types";

export function moveInFitsCase(moveIn: MoveInReport | undefined, facts: Pick<CaseFacts, "moveOutDate">): boolean {
  return Boolean(moveIn && facts.moveOutDate && moveIn.moveInDate <= facts.moveOutDate);
}
