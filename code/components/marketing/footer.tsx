import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-[#e8e6e0]">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12 min-h-[68px] flex flex-col sm:flex-row items-center justify-between py-4 sm:py-0 gap-3 sm:gap-6 text-xs text-[#77756f]">
        {/* Left: Athena Logo */}
        <Link
          href="#top"
          className="flex items-center gap-2.5 text-[#292825] font-semibold tracking-tight transition-opacity hover:opacity-80"
          aria-label="Athena home"
        >
          <span
            className="w-[22px] h-[22px] rounded-[5px] bg-[#292825] text-white flex items-center justify-center font-serif italic text-[15px] leading-none select-none pb-[1px]"
            aria-hidden="true"
          >
            a
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.04em] text-[#292825]">
            athena
          </span>
        </Link>

        {/* Center: Tagline */}
        <span className="font-serif italic text-[11px] sm:text-[12px] text-[#89867e] text-center select-none">
          Tasks. Focus. Resources. Together.
        </span>

        {/* Right: Links row */}
        <div className="flex items-center gap-5 text-[11px] sm:text-xs">
          <Link
            href="/login"
            className="text-[#66645f] hover:text-[#171715] transition-colors"
          >
            Log in
          </Link>
          <span className="text-[#9d9a92] font-normal">
            &copy; 2026 Athena
          </span>
        </div>
      </div>
    </footer>
  );
}

export const SiteFooter = Footer;
export default Footer;
