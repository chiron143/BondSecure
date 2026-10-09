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
  return new Promise((resolve) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done);
    video.currentTime = Math.min(Math.max(t, 0), Math.max(video.duration - 0.05, 0));
  });
}

/** Grabs a JPEG still at time `t` (seconds), scaled to at most `maxWidth` px wide. */
export async function grabFrame(video: HTMLVideoElement, t: number, maxWidth = 960): Promise<string> {
  await seek(video, t);
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
