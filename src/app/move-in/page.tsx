import { Suspense } from "react";
import MoveIn from "./MoveIn";

export const metadata = { title: "Move-in report · Bond Secure" };

// The tool reads today's date and runs entirely in the browser, so it renders per visit.
export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10 text-muted sm:px-6">Loading…</div>}>
      <MoveIn />
    </Suspense>
  );
}
