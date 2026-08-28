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
  // TODO(Alp): set NEXT_PUBLIC_SITE_URL in Vercel once the domain is live.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/products", label: "Bileklikler" },
  { href: "/cart", label: "Sepet" },
] as const;
