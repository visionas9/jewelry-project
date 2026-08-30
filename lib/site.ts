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

export const NAV_LINKS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/products", label: "Bileklikler" },
  { href: "/cart", label: "Sepet" },
  { href: "/signup", label: "Kayıt Ol" },
] as const;
