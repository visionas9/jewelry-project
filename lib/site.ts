// Single source of truth for brand text + nav.
// Change the name here and it updates the header, footer, and every page title.

export const SITE = {
  // Always lowercase, everywhere. The header and footer force it in CSS too, so
  // a stray capital here still renders correctly.
  name: "ishin denshin",
  tagline: "Tek tek elde dizilen doğal taş bileklikler",
  description:
    "Her bileklik gerçek doğal taşlarla, tek tek elde diziliyor. Küçük üretim, sade tasarım — kendine ya da sevdiğin birine.",
  // Absolute base for OG/canonical URLs. Social apps can't resolve "/images/x.jpg".
  //
  // Three sources, most specific first:
  //   NEXT_PUBLIC_SITE_URL          — set this by hand once there's a real domain.
  //   VERCEL_PROJECT_PRODUCTION_URL — Vercel sets this at build time to the
  //     project's production domain. It follows a project rename on its own, so
  //     nothing here has to be updated when the deployment URL changes. Vercel
  //     gives it without a protocol, hence the https:// in front.
  //   localhost                     — development.
  //
  // On preview builds this still resolves to the *production* domain, which is
  // what canonical tags want: a preview shouldn't advertise itself as the
  // canonical copy of a page.
  //
  // Read only on the server — metadata, header, footer. That's why the Vercel
  // variable needs no NEXT_PUBLIC_ prefix, and why importing SITE into a client
  // component would quietly leave this undefined there.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
} as const;

// Where an auth email should send someone back to.
//
// Deliberately not SITE.url. That one is the canonical production address, and
// a preview build claiming the preview domain in its OG tags would be wrong.
// But a confirmation or reset link built from it is worse: it sends whoever is
// testing a preview to the live site, where the branch they are testing does
// not exist yet — a 404 on a link that looks like it should work.
//
// So on a Vercel preview this follows the branch's own URL, which is stable
// across pushes to that branch (unlike VERCEL_URL, which changes on every
// deploy and would need a new entry in Supabase's redirect allow list each
// time). Production and local development are untouched.
//
// The address only reaches the email because it is passed as `redirectTo` and
// the templates build their link from it. Supabase refuses a redirect that is
// not on the project's allow list, so preview domains have to be listed there
// — see README. Server-only, like SITE.url.
export const AUTH_URL =
  process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : SITE.url;

export const NAV_LINKS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/products", label: "Bileklikler" },
  { href: "/cart", label: "Sepet" },
  // No sign-up link here. The header's auth slot is rendered by HeaderAuth
  // instead, because what belongs there depends on whether anyone is signed in
  // — and offering "Kayıt Ol" to a member who already has an account is worse
  // than making them take one hop through the sign-in page, which links to
  // sign-up itself.
] as const;
