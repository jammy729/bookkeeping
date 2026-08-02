import { cn } from "../lib/utils";

interface LogoProps {
  className?: string;
}

/**
 * App logo mark: an open ledger book with a checkmark — "your books are
 * accurate and balanced". The tile, pages, and checkmark all derive from
 * the theme CSS variables, so the mark adapts to light/dark mode and to the
 * active `primary` color.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-10 w-10", className)}
      role="img"
      aria-label="Bookkeeping logo"
    >
      {/* Rounded square tile */}
      <rect width="32" height="32" rx="7" className="fill-primary" />
      {/* Open ledger book (left page) */}
      <path
        className="fill-primary-foreground"
        d="M16 10.8c-2.4-1.3-5.7-1.5-9-.4v11.2c3.3-1.1 6.6-.9 9 .4V10.8z"
      />
      {/* Open ledger book (right page) */}
      <path
        className="fill-primary-foreground"
        d="M16 10.8c2.4-1.3 5.7-1.5 9-.4v11.2c-3.3-1.1-6.6-.9-9 .4V10.8z"
      />
      {/* Checkmark: the books are accurate / balanced */}
      <path
        fill="none"
        className="stroke-primary"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.2 16.2l2.4 2.4 5.2-5.4"
      />
    </svg>
  );
}
