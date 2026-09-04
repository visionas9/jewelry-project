// When the quick-add button has nothing left to add.
//
// Pulled out of the component so it can be checked directly: this is the one
// piece of the button that is a rule rather than a rendering, and a rule is
// worth being sure about.

export function cartIsFull({
  hydrated,
  inCart,
  stock,
}: {
  /** Whether the cart has been read back from localStorage yet. */
  hydrated: boolean;
  inCart: number;
  stock: number;
}): boolean {
  // Before hydration the cart is empty as far as this component knows, so
  // comparing against it would disable the button for a moment on every page
  // load — and a control that starts dead and comes alive looks broken. The
  // store clamps to `max` on the way in, so an early tap cannot overfill.
  if (!hydrated) return false;

  return inCart >= stock;
}
