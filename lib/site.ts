// Single source of truth for brand text + nav.
// Change the name here and it updates the header, footer, and every page title.

export const SITE = {
  // TODO(Alp): replace with the real business name.
  name: "Atölye Taş",
  tagline: "El yapımı doğal taş bileklikler",
  description:
    "Her biri elde dizilen, doğal taşlardan yapılmış bileklikler. Küçük üretim, gerçek taş, sade tasarım.",
  // Absolute base for OG/canonical URLs. Social apps can't resolve "/images/x.jpg".
  // TODO(Alp): set NEXT_PUBLIC_SITE_URL in Vercel once the domain is live.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/products", label: "Bileklikler" },
  { href: "/cart", label: "Sepet" },
] as const;
