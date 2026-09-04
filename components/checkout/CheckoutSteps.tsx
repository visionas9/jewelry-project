// Where somebody is in the three moves between a full cart and a placed order.
//
// Buying here is not one screen, and without this it does not look like one
// journey either: signing in reads as an interruption rather than as step one
// of three. Naming the steps is what turns "why am I being asked to log in"
// into "of course, I am at the beginning".
//
// A server component with no state — every page that shows it knows which step
// it is, so there is nothing to work out at runtime.
const STEPS = ["Giriş", "Teslimat", "Ödeme"] as const;

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol
      // Read as a list of steps rather than as three loose words, and the one
      // in progress is announced as such.
      aria-label="Sipariş adımları"
      className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
    >
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const here = step === current;

        return (
          <li key={label} className="flex items-center gap-3">
            <span
              aria-current={here ? "step" : undefined}
              className={`flex items-center gap-2 ${
                here ? "text-ink" : "text-muted"
              }`}
            >
              <span
                aria-hidden
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${
                  here
                    ? "bg-ink text-cream"
                    : done
                      ? "bg-clay text-cream"
                      : "border border-line text-muted"
                }`}
              >
                {/* A finished step stops being a number: the tick is the part
                    somebody actually reads. */}
                {done ? "✓" : step}
              </span>
              {label}
            </span>

            {step < STEPS.length ? (
              <span aria-hidden className="h-px w-6 bg-line sm:w-10" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
