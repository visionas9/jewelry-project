// Where a visitor may be sent back to after signing in.
//
// The return path arrives in a query string, which means anyone can put
// anything in it — including a link to their own site. A sign-in page that
// forwards to whatever it is handed is an open redirect: an attacker sends
// `/signin?next=https://ishin-denshin.evil/` from a genuine
// ishindenshinstore.com link, the visitor signs in for real, and lands on a
// copy of the shop asking them to "confirm" their card. The URL they checked
// before typing their password was the real one.
//
// So only same-site paths get through, and anything else is dropped rather
// than repaired — a value that is not obviously safe is not worth guessing at.
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== "string" || value === "") return null;

  // Must be a path on this site. `//evil.com` is the one that catches people
  // out: it looks relative, but a browser reads it as "same protocol, new
  // host".
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  // Some browsers normalise backslashes to forward slashes, so `/\evil.com`
  // turns into `//evil.com` after the check above has already let it past.
  if (value.includes("\\")) return null;

  // A control character can cut a Location header short and leave whatever
  // follows it to be read as something else.
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;

  return value;
}
