import Link from "next/link";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Magic UI's ShimmerButton as a real link (ShimmerLink) or a real button (ShimmerAction),
// so a link is never a <button> nested inside an <a>. Same markup and animation classes as
// components/ui/shimmer-button.

const vars = (background: string, shimmerColor: string) =>
  ({
    "--spread": "90deg",
    "--shimmer-color": shimmerColor,
    "--radius": "16px",
    "--speed": "3s",
    "--cut": "0.08em",
    "--bg": background,
  }) as CSSProperties;

const base =
  "group relative z-0 inline-flex items-center justify-center gap-2 overflow-hidden [border-radius:var(--radius)] border border-white/15 px-7 py-4 text-base font-bold whitespace-nowrap text-white [background:var(--bg)] transform-gpu shadow-[0_10px_40px_-10px_rgba(16,185,129,0.75)] transition-transform duration-300 ease-in-out hover:-translate-y-0.5 active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

function Shine() {
  return (
    <>
      <div className="@container-[size] absolute inset-0 -z-30 overflow-visible blur-[2px]" aria-hidden>
        <div className="animate-shimmer-slide absolute inset-0 aspect-[1] h-[100cqh] rounded-none [mask:none]">
          <div className="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
        </div>
      </div>
      <div
        className="absolute inset-0 size-full [border-radius:var(--radius)] shadow-[inset_0_-8px_10px_#ffffff1f] transition-all duration-300 group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]"
        aria-hidden
      />
      <div className="absolute inset-(--cut) -z-20 [border-radius:var(--radius)] [background:var(--bg)]" aria-hidden />
    </>
  );
}

const GREEN = "linear-gradient(135deg, #10b981, #047857)";
const MINT = "#d1fae5";

export default function ShimmerLink({
  href,
  children,
  className,
  background = GREEN,
  shimmerColor = MINT,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  background?: string;
  shimmerColor?: string;
}) {
  return (
    <Link href={href} style={vars(background, shimmerColor)} className={cn(base, className)}>
      <Shine />
      {children}
    </Link>
  );
}

export function ShimmerAction({
  children,
  className,
  background = GREEN,
  shimmerColor = MINT,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { background?: string; shimmerColor?: string }) {
  return (
    <button type="button" style={vars(background, shimmerColor)} className={cn(base, className)} {...props}>
      <Shine />
      {children}
    </button>
  );
}
