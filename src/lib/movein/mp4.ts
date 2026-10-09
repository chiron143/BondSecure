// Reads when an MP4/MOV video was recorded, from the "mvhd" box the camera writes.
// That's stronger evidence than the file's modified date, which changes when a file is
// copied or downloaded. Pure code with a byte reader, so it runs in the browser and in tests.

export type ReadBytes = (start: number, length: number) => Promise<Uint8Array>;

const MAC_EPOCH_OFFSET = 2082844800; // seconds from 1904-01-01 to 1970-01-01

const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
const u64 = (b: Uint8Array, o: number) => u32(b, o) * 2 ** 32 + u32(b, o + 4);
const type = (b: Uint8Array, o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

/** Finds a box by type in [start, end), returning where its payload starts and ends. */
async function findBox(read: ReadBytes, start: number, end: number, want: string) {
  let pos = start;
  while (pos + 8 <= end) {
    const h = await read(pos, 16);
    if (h.length < 8) return null;
    let size = u32(h, 0);
    let header = 8;
    if (size === 1) {
      size = u64(h, 8);
      header = 16;
    } else if (size === 0) {
      size = end - pos;
    }
    if (size < header) return null;
    if (type(h, 4) === want) return { payload: pos + header, end: pos + size };
    pos += size;
  }
  return null;
}

/** ISO datetime the video was recorded, or undefined if the file doesn't say. */
export async function readRecordedAt(read: ReadBytes, fileSize: number): Promise<string | undefined> {
  try {
    const moov = await findBox(read, 0, fileSize, "moov");
    if (!moov) return undefined;
    const mvhd = await findBox(read, moov.payload, moov.end, "mvhd");
    if (!mvhd) return undefined;
    const b = await read(mvhd.payload, 12);
    const secs = b[0] === 1 ? u64(b, 4) : u32(b, 4);
    const ms = (secs - MAC_EPOCH_OFFSET) * 1000;
    // Cameras without a clock write 0 (1904) or 1970; treat anything implausible as unknown.
    if (!secs || ms < Date.UTC(2005, 0, 1) || ms > Date.now() + 86_400_000) return undefined;
    return new Date(ms).toISOString();
  } catch {
    return undefined;
  }
}

/** Byte reader over a browser File. */
export const fileReader =
  (file: Blob): ReadBytes =>
  async (start, length) =>
    new Uint8Array(await file.slice(start, start + length).arrayBuffer());
