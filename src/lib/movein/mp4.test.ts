import { describe, expect, it } from "vitest";
import { readRecordedAt, type ReadBytes } from "./mp4";

const box = (type: string, payload: number[]) => {
  const size = 8 + payload.length;
  return [(size >>> 24) & 255, (size >>> 16) & 255, (size >>> 8) & 255, size & 255, ...[...type].map((c) => c.charCodeAt(0)), ...payload];
};
const be32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const reader = (bytes: number[]): ReadBytes => async (s, l) => Uint8Array.from(bytes.slice(s, s + l));

// 3 Feb 2026 10:00:00 UTC in seconds since 1904
const recorded = Date.UTC(2026, 1, 3, 10) / 1000 + 2082844800;

describe("readRecordedAt", () => {
  it("reads the recording time from mvhd, with moov after mdat (typical phone file)", async () => {
    const mvhd = box("mvhd", [0, 0, 0, 0, ...be32(recorded), ...be32(recorded), ...Array(20).fill(0)]);
    const file = [...box("ftyp", [..."qt  ".split("").map((c) => c.charCodeAt(0)), 0, 0, 0, 0]), ...box("mdat", Array(100).fill(7)), ...box("moov", mvhd)];
    expect(await readRecordedAt(reader(file), file.length)).toBe("2026-02-03T10:00:00.000Z");
  });

  it("returns undefined when the camera wrote no date", async () => {
    const mvhd = box("mvhd", [0, 0, 0, 0, 0, 0, 0, 0, ...Array(24).fill(0)]);
    const file = box("moov", mvhd);
    expect(await readRecordedAt(reader(file), file.length)).toBeUndefined();
  });

  it("returns undefined for something that isn't a video", async () => {
    const junk = Array.from({ length: 64 }, (_, n) => n);
    expect(await readRecordedAt(reader(junk), junk.length)).toBeUndefined();
  });
});
