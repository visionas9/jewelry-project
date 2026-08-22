// Single source of truth for brand text + nav.
// Change the name here and it updates the header, footer, and every page title.

export const SITE = {
  // TODO(Alp): replace with the real business name.
  name: "Atölye Taş",
  tagline: "El yapımı doğal taş bileklikler",
  description:
    "Her biri elde dizilen, doğal taşlardan yapılmış bileklikler. Küçük üretim, gerçek taş, sade tasarım.",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/products", label: "Bileklikler" },
  { href: "/cart", label: "Sepet" },
] as const;
