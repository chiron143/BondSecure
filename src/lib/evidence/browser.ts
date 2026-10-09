"use client";

// Prepares receipts and screenshots for the evidence reader: shrinks big photos so a
// handful fit in one request. Nothing is stored; files are sent once and forgotten.

export interface PreparedFile {
  name: string;
  mimeType: string;
  data: string; // base64, no prefix
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error(`Couldn't read ${(blob as File).name ?? "a file"}.`));
    r.readAsDataURL(blob);
  });

async function shrinkImage(file: File, maxSide = 1600): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } catch {
    return null; // e.g. HEIC in a browser that can't draw it; send the original instead
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareFiles(files: File[]): Promise<PreparedFile[]> {
  const out: PreparedFile[] = [];
  for (const f of files) {
    const type = f.type || (f.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "");
    if (type.startsWith("image/")) {
      const small = await shrinkImage(f);
      out.push(small ? { name: f.name, mimeType: "image/jpeg", data: await toBase64(small) } : { name: f.name, mimeType: type, data: await toBase64(f) });
    } else if (type === "application/pdf" || type === "text/plain") {
      out.push({ name: f.name, mimeType: type, data: await toBase64(f) });
    } else {
      throw new Error(`${f.name} isn't a screenshot, photo or PDF.`);
    }
  }
  return out;
}
