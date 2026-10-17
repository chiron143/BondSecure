import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Magic UI's ShimmerButton as a real link, so it can be middle-clicked and isn't a button
// nested inside an <a>. Same markup and animation classes as components/ui/shimmer-button.
export default function ShimmerLink({
  href,
  children,
  className,
  background = "linear-gradient(135deg, #10b981, #047857)",
  shimmerColor = "#d1fae5",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  background?: string;
  shimmerColor?: string;
}) {
  return (
    <Link
      href={href}
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": "14px",
          "--speed": "3s",
          "--cut": "0.08em",
          "--bg": background,
        } as CSSProperties
      }
      className={cn(
        "group relative z-0 inline-flex items-center justify-center gap-2 overflow-hidden [border-radius:var(--radius)] border border-white/15 px-6 py-3.5 text-[15px] font-semibold whitespace-nowrap text-white [background:var(--bg)]",
        "transform-gpu shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] transition-transform duration-300 ease-in-out hover:-translate-y-0.5 active:translate-y-px",
        className,
      )}
    >
      <div className="@container-[size] absolute inset-0 -z-30 overflow-visible blur-[2px]" aria-hidden>
        <div className="animate-shimmer-slide absolute inset-0 aspect-[1] h-[100cqh] rounded-none [mask:none]">
          <div className="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
        </div>
      </div>
      {children}
      <div
        className="absolute inset-0 size-full [border-radius:var(--radius)] shadow-[inset_0_-8px_10px_#ffffff1f] transition-all duration-300 group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]"
        aria-hidden
      />
      <div className="absolute inset-(--cut) -z-20 [border-radius:var(--radius)] [background:var(--bg)]" aria-hidden />
    </Link>
  );
}
