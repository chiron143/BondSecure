"use client";

import Link from "next/link";
import { useState } from "react";
import type { MoveInReport } from "@/lib/movein/types";
import { readReportData } from "@/lib/pdf/reportData";
import { formatDate } from "@/lib/rules/dates";
import { useStore } from "@/lib/store";

// Move-in and move-out are months apart, usually in different browser sessions. The move-in
// PDF carries its own data, so uploading it here brings the evidence back. Read on the
// device only: the PDF is never sent anywhere.
export default function MoveInUpload({ onLoaded }: { onLoaded?: (r: MoveInReport) => void }) {
  const store = useStore();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const report = await readReportData(await file.arrayBuffer());
      if (!report) {
        setError("That PDF doesn't contain Bond Secure report data. Upload the move-in report PDF Bond Secure gave you, exactly as downloaded.");
        return;
      }
      store.setMoveIn(report);
      onLoaded?.(report);
    } finally {
      setBusy(false);
    }
  }

  const m = store.moveIn;
  const problems = m ? m.items.filter((i) => i.status === "confirmed" && i.condition !== "good").length : 0;

  return (
    <div className="card mt-4">
      <p className="font-semibold">Your move-in report</p>
      {m ? (
        <p className="mt-1 text-sm">
          ✓ Loaded: {m.propertyAddress}, filmed {formatDate(m.moveInDate)}, {problems} problem{problems === 1 ? "" : "s"} that were already there.
          {m.demo && <span className="text-warn"> (demo report)</span>}
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">
          Made one when you moved in? Upload the PDF and the photos of damage that was already there go into your claim pack.
          No report? You can still continue, and use your own photos.{" "}
          <Link className="underline" href="/move-in">What&apos;s a move-in report?</Link>
        </p>
      )}
      <label className="btn-ghost mt-3 w-full cursor-pointer">
        {busy ? "Reading…" : m ? "Upload a different report" : "Upload my move-in report (PDF)"}
        <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => { load(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {error && <p className="mt-2 rounded-xl bg-warn-soft p-3 text-sm text-warn">{error}</p>}
      <p className="mt-2 text-xs text-muted">The PDF is read on your phone. It isn&apos;t uploaded anywhere.</p>
    </div>
  );
}
