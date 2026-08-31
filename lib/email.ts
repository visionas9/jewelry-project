// The one shape check for an address someone typed.
//
// Cheap, and deliberately not RFC 5322: the real verdict comes from Supabase
// and from whether the mail actually arrives. This only spares the visitor a
// network roundtrip for an obvious typo.
//
// Shared rather than copied because the sign-up form and the reset form judge
// the same thing. Two regexes drifting apart would mean an address accepted on
// one page and rejected on the other.
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function looksLikeEmail(value: string): boolean {
  return LOOKS_LIKE_EMAIL.test(value);
}
