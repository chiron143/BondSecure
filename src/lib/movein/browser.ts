"use client";

// Browser-only helpers for the move-in video: read its duration, grab still frames
// at timestamps, and fingerprint the file. Nothing here uploads anything.

import { formatTimestamp } from "./format";

export function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("This video couldn't be opened in your browser. Try an MP4 or MOV file."));
  });
}

function seek(video: HTMLVideoElement, t: number): Promise<void> {
  const target = Math.min(Math.max(t, 0), Math.max(video.duration - 0.05, 0));
  return new Promise((resolve) => {
    // Setting currentTime to where it already is fires no "seeked" event, so don't wait for one.
    if (Math.abs(video.currentTime - target) < 0.001 && video.readyState >= 2) return resolve();
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      video.removeEventListener("seeked", done);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, 4000); // never hang the whole report on one frame
    video.addEventListener("seeked", done);
    video.currentTime = target;
  });
}

/** After a seek, wait until the new frame is actually ready to draw (matters on phones). */
function frameReady(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
    const timer = setTimeout(resolve, 250);
    if (v.requestVideoFrameCallback && !video.paused) {
      v.requestVideoFrameCallback(() => { clearTimeout(timer); resolve(); });
    } else if (video.readyState >= 2) {
      clearTimeout(timer);
      // One animation frame lets the decoder paint the sought frame.
      requestAnimationFrame(() => resolve());
    }
  });
}

/**
 * How usable a frame is as evidence: sharp (not motion-blurred) and not too dark or blown out.
 * Sharpness is the variance of a Laplacian over a small greyscale copy.
 */
function frameScore(video: HTMLVideoElement): number {
  const w = 160;
  const h = Math.max(1, Math.round(w * ((video.videoHeight || 9) / (video.videoWidth || 16))));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;
  ctx.drawImage(video, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0; i < w * h; i++) {
    g[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    sum += g[i];
  }
  const mean = sum / (w * h);
  let acc = 0;
  let acc2 = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      acc += lap;
      acc2 += lap * lap;
      n++;
    }
  }
  const sharpness = n ? acc2 / n - (acc / n) ** 2 : 0;
  const exposure = mean < 20 || mean > 245 ? 0.1 : mean < 45 ? 0.5 : 1; // near-black or white frames lose
  return sharpness * exposure;
}

/**
 * The AI gives the second where an item shows up, which is often while the camera is still
 * moving onto it. Look at a few frames around that second and keep the clearest one.
 * Returns the time actually used, so the report's timestamp matches the still.
 */
export async function bestFrameTime(video: HTMLVideoElement, t: number): Promise<number> {
  const max = Math.max(video.duration - 0.05, 0);
  const candidates = [...new Set([t, t + 0.5, t + 1, t - 0.5].map((x) => Math.round(Math.min(Math.max(x, 0), max) * 10) / 10))];
  let best = { t: candidates[0], score: -1 };
  for (const c of candidates) {
    await seek(video, c);
    await frameReady(video);
    const score = frameScore(video);
    // Prefer the AI's own time unless another frame is clearly better.
    if (score > best.score * (best.t === candidates[0] ? 1.25 : 1)) best = { t: c, score };
  }
  return best.t;
}

/** Grabs a JPEG still at time `t` (seconds), scaled to at most `maxWidth` px wide. */
export async function grabFrame(video: HTMLVideoElement, t: number, maxWidth = 960): Promise<string> {
  await seek(video, t);
  await frameReady(video);
  const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((video.videoWidth || maxWidth) * scale);
  canvas.height = Math.round((video.videoHeight || maxWidth * 0.5625) * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  // Burn the timestamp into the frame so it travels with the image.
  const label = formatTimestamp(t);
  ctx.font = `${Math.round(canvas.width / 32)}px system-ui, sans-serif`;
  const pad = 8;
  const w = ctx.measureText(label).width + pad * 2;
  const h = Math.round(canvas.width / 24);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(pad, canvas.height - h - pad, w, h);
  ctx.fillStyle = "#fff";
  ctx.fillText(label, pad * 2, canvas.height - pad - h / 3);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/** SHA-256 of the exact video file, so the report can prove which video it came from. */
export async function sha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
