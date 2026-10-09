// A tiny layout helper on top of pdf-lib: wrapped text, headings, bullets, images,
// and automatic page breaks. Runs in the browser, so documents never leave the device.

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 50;

export const INK = rgb(0.11, 0.13, 0.16);
export const MUTED = rgb(0.36, 0.4, 0.45);
export const ACCENT = rgb(0.06, 0.4, 0.33);
export const WARN = rgb(0.7, 0.25, 0.1);
export const LINE = rgb(0.85, 0.87, 0.89);

export class Doc {
  pdf!: PDFDocument;
  regular!: PDFFont;
  bold!: PDFFont;
  page!: PDFPage;
  y = 0;
  footer: string;
  private safeCache = new Map<string, boolean>();

  constructor(footer: string) {
    this.footer = footer;
  }

  static async create(title: string, footer: string) {
    const d = new Doc(footer);
    d.pdf = await PDFDocument.create();
    d.pdf.setTitle(title);
    d.pdf.setProducer("Bond Secure");
    d.pdf.setCreator("Bond Secure");
    d.regular = await d.pdf.embedFont(StandardFonts.Helvetica);
    d.bold = await d.pdf.embedFont(StandardFonts.HelveticaBold);
    d.newPage();
    return d;
  }

  get width() {
    return A4.w - MARGIN * 2;
  }

  newPage() {
    this.page = this.pdf.addPage([A4.w, A4.h]);
    this.y = A4.h - MARGIN;
  }

  ensure(height: number) {
    if (this.y - height < MARGIN + 20) this.newPage();
  }

  /** Standard PDF fonts can't draw every script; replace what they can't with "?". */
  safe(text: string): string {
    let out = "";
    for (const ch of text.replace(/\t/g, "  ")) {
      if (ch === "\n") {
        out += ch;
        continue;
      }
      let ok = this.safeCache.get(ch);
      if (ok === undefined) {
        try {
          this.regular.encodeText(ch);
          ok = true;
        } catch {
          ok = false;
        }
        this.safeCache.set(ch, ok);
      }
      out += ok ? ch : "?";
    }
    return out;
  }

  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const lines: string[] = [];
    for (const para of this.safe(text).split("\n")) {
      if (!para.trim()) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const word of para.split(/\s+/)) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) > width && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  text(
    text: string,
    opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; width?: number; gap?: number } = {},
  ) {
    const size = opts.size ?? 10.5;
    const font = opts.bold ? this.bold : this.regular;
    const x = opts.x ?? MARGIN;
    const width = opts.width ?? this.width - (x - MARGIN);
    const lh = size * 1.38;
    for (const line of this.wrap(text, font, size, width)) {
      this.ensure(lh);
      this.page.drawText(line, { x, y: this.y - size, size, font, color: opts.color ?? INK });
      this.y -= lh;
    }
    this.y -= opts.gap ?? 4;
  }

  heading(text: string, size = 15) {
    this.ensure(size * 3);
    this.y -= 6;
    this.text(text, { size, bold: true, gap: 6 });
  }

  bullets(items: string[], opts: { size?: number; color?: ReturnType<typeof rgb>; numbered?: boolean } = {}) {
    for (const [n, item] of items.entries()) {
      const size = opts.size ?? 10.5;
      this.ensure(size * 1.4);
      const mark = opts.numbered ? `${n + 1}.` : "•";
      this.page.drawText(mark, { x: MARGIN + 2, y: this.y - size, size, font: this.regular, color: opts.color ?? INK });
      this.text(item, { size, x: MARGIN + 14, gap: 3, color: opts.color });
    }
    this.y -= 4;
  }

  rule() {
    this.ensure(12);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y - 4 },
      end: { x: A4.w - MARGIN, y: this.y - 4 },
      thickness: 0.6,
      color: LINE,
    });
    this.y -= 12;
  }

  box(lines: string[], color = ACCENT) {
    const size = 10.5;
    const wrapped = lines.flatMap((l) => this.wrap(l, this.regular, size, this.width - 24));
    const h = wrapped.length * size * 1.38 + 16;
    this.ensure(h + 6);
    this.page.drawRectangle({ x: MARGIN, y: this.y - h, width: this.width, height: h, borderColor: color, borderWidth: 1 });
    let y = this.y - 8;
    for (const l of wrapped) {
      this.page.drawText(l, { x: MARGIN + 12, y: y - size, size, font: this.regular, color: INK });
      y -= size * 1.38;
    }
    this.y -= h + 10;
  }

  async jpeg(dataUrl: string) {
    const bytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
    return this.pdf.embedJpg(bytes);
  }

  /** Image on the left, text block on the right. */
  async imageRow(dataUrl: string | undefined, lines: { text: string; bold?: boolean; color?: ReturnType<typeof rgb> }[]) {
    const imgW = 190;
    let imgH = 0;
    let img;
    if (dataUrl) {
      img = await this.jpeg(dataUrl);
      imgH = (img.height / img.width) * imgW;
    }
    const textX = MARGIN + (img ? imgW + 14 : 0);
    const textW = this.width - (img ? imgW + 14 : 0);
    const textH = lines.reduce((h, l) => h + this.wrap(l.text, l.bold ? this.bold : this.regular, 10, textW).length * 13.8 + 2, 0);
    const rowH = Math.max(imgH, textH) + 12;
    this.ensure(rowH);
    const top = this.y;
    if (img) this.page.drawImage(img, { x: MARGIN, y: top - imgH, width: imgW, height: imgH });
    for (const l of lines) this.text(l.text, { x: textX, width: textW, size: 10, bold: l.bold, color: l.color, gap: 2 });
    this.y = Math.min(this.y, top - imgH) - 12;
  }

  async save(): Promise<Uint8Array> {
    const pages = this.pdf.getPages();
    pages.forEach((p, i) => {
      const label = this.safe(`${this.footer}   ·   Page ${i + 1} of ${pages.length}`);
      p.drawText(label, { x: MARGIN, y: 28, size: 8, font: this.regular, color: MUTED });
    });
    return this.pdf.save();
  }
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
