import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/app/signout/actions";
import { DisplayNameForm } from "@/components/account/DisplayNameForm";
import { requireMember } from "@/lib/auth-guard";
import { getDisplayName } from "@/lib/profiles";

export const metadata: Metadata = {
  // Nothing here is meant for a search result, and there is nothing a
  // signed-out crawler could see anyway.
  title: "Hesabım",
  robots: { index: false },
};

// The session read sits behind a Suspense boundary rather than at the top of
// the page. Everything outside the boundary still prerenders into the static
// shell; only the part that actually depends on who is asking waits for the
// request. Same shape as /welcome.
export default function AccountPage() {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">Hesabım</h1>

      <Suspense fallback={<Placeholder />}>
        <Account />
      </Suspense>
    </section>
  );
}

async function Account() {
  const { user, supabase } = await requireMember("/account");
  const displayName = await getDisplayName(supabase, user.id);

  return (
    <>
      {/* The email stays, because this page is the member's own and nobody
          else can reach it. It is everywhere *else* — reviews, comments — that
          the display name exists to stand in for it. */}
      <p className="mt-4 text-sm leading-relaxed text-muted">
        {displayName ? (
          <>
            <span className="text-ink">{displayName}</span> olarak
            görünüyorsunuz. Hesabınız {user.email} adresine kayıtlı.
          </>
        ) : (
          <>
            Hesabınız <span className="text-ink">{user.email}</span> adresine
            kayıtlı.
          </>
        )}
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-sand/60 px-5 py-6">
        <h2 className="font-display text-xl">Görünen adınız</h2>
        <DisplayNameForm current={displayName} />
      </div>

      {/* An account with no orders yet has almost nothing to show, and a page
          that shows almost nothing reads as broken. Saying what will appear
          here is what makes it read as empty instead. */}
      <div className="mt-6 rounded-2xl border border-line px-5 py-6">
        <h2 className="font-display text-xl">Burada neler olacak</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Verdiğiniz siparişler ve teslimat bilgileriniz bu sayfada toplanacak.
          Şu an için hesabınız, alışverişe kaldığınız yerden devam edebilmeniz
          içindir.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Sepetiniz hesabınızdan bağımsızdır; kullandığınız cihazda saklanır.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/products"
          className="rounded-full bg-ink px-7 py-3 text-center text-sm tracking-wide text-cream transition-colors hover:bg-brass"
        >
          Bilekliklere göz at
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full border border-line px-7 py-3 text-sm transition-colors hover:border-ink sm:w-auto"
          >
            Çıkış yap
          </button>
        </form>
      </div>
    </>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="mt-6 h-4 w-2/3 rounded-full bg-sand" />
      <div className="mt-8 h-48 w-full rounded-2xl bg-sand" />
      <div className="mt-6 h-40 w-full rounded-2xl bg-sand" />
      <div className="mt-8 h-12 w-56 rounded-full bg-sand" />
    </div>
  );
}
