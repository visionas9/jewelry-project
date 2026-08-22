import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
        <p className="font-display text-base tracking-[0.15em] text-ink uppercase">
          {SITE.name}
        </p>
        <p>{SITE.tagline}</p>
        <p>
          © {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
