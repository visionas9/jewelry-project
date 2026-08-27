"use client";

// Presentational only — no routing, no debounce. The products page drives it as
// you type; the home page wraps it in a form and navigates on submit. Keeping
// the markup in one place means both look identical.
export function SearchField({
  id,
  value,
  onChange,
  onClear,
  placeholder = "Bileklik ara…",
  label,
  isPending = false,
  autoComplete = "off",
  submitLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  label: string;
  isPending?: boolean;
  autoComplete?: string;
  // When set, renders a real submit button. A form with no submit button falls
  // back to implicit submission, which browsers apply inconsistently — Enter
  // silently did nothing here.
  submitLabel?: string;
}) {
  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-muted"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" strokeLinecap="round" />
        </svg>
      </span>

      <input
        id={id}
        // `type="search"` gives phones a Search key on the keyboard, but its
        // native clear button is unstyleable, so appearance-none removes it in
        // favour of the one below.
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full appearance-none rounded-full border border-line bg-cream py-3 pr-12 pl-12 text-sm outline-none transition-colors placeholder:text-muted focus:border-ink [&::-webkit-search-cancel-button]:appearance-none"
      />

      <span className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-2">
        {isPending ? (
          <span
            aria-hidden="true"
            className="size-3 animate-pulse rounded-full bg-brass"
          />
        ) : (
          <>
            {value && onClear ? (
              <button
                type="button"
                onClick={onClear}
                aria-label="Aramayı temizle"
                className="text-muted transition-colors hover:text-ink"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}

            {submitLabel ? (
              <button
                type="submit"
                aria-label={submitLabel}
                className="text-muted transition-colors hover:text-ink"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
          </>
        )}
      </span>
    </div>
  );
}
