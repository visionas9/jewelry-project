import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE } from "@/lib/site";
import "./globals.css";

// "latin-ext" is required — it carries ş, ğ, ı, İ, ç, ö, ü.
// Without it Turkish product names render with fallback glyphs.
const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin", "latin-ext"],
});

// Both are variable fonts, so no weight list: the whole range ships in one file
// and the display face can be set softly at 400 or firmly at 600 without a
// second download.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${karla.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* Page views, counted by Vercel. Cookieless and with no visitor
            identifier, which is why it needs no consent banner — there is
            nothing here to ask permission for. It only reports from a real
            deployment, so it is inert in development. */}
        <Analytics />
      </body>
    </html>
  );
}
