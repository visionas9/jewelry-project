// A turning ring, in the colour of whatever text it sits next to.
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      // Decorative: every button that uses it also changes its label, and the
      // label is what a screen reader should read.
      aria-hidden
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px] ${className}`}
    />
  );
}
