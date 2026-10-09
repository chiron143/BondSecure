"use client";

// App state lives in the browser only (no accounts, no database). The move-in report is
// kept in memory while the tab is open and saved to sessionStorage when it fits, so a
// refresh doesn't lose it. Video stills can be large, so saving may silently fail; the
// student can always re-download the PDF.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Parties } from "./content/letters";
import type { MoveInReport } from "./movein/types";
import type { CaseFacts } from "./rules/types";

interface State {
  moveIn?: MoveInReport;
  facts?: CaseFacts;
  parties?: Parties;
}

interface Store extends State {
  setMoveIn: (r: MoveInReport | undefined) => void;
  setCase: (facts: CaseFacts, parties: Parties) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);
const KEY = "bond-secure:v1";

function load(): State {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as State;
  } catch {
    return {};
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({});

  useEffect(() => {
    // Restore after hydration so server and client render the same first frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(load());
  }, []);

  const save = (next: State) => {
    setState(next);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      try {
        // Too big with the video stills: keep the text, drop the images.
        const slim = next.moveIn
          ? { ...next, moveIn: { ...next.moveIn, items: next.moveIn.items.map((i) => ({ ...i, frame: undefined })) } }
          : next;
        sessionStorage.setItem(KEY, JSON.stringify(slim));
      } catch {
        /* storage unavailable; memory only */
      }
    }
  };

  const store: Store = {
    ...state,
    setMoveIn: (moveIn) => save({ ...state, moveIn }),
    setCase: (facts, parties) => save({ ...state, facts, parties }),
    reset: () => save({}),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
