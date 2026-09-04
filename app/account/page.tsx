import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/app/signout/actions";
import { DisplayNameForm } from "@/components/account/DisplayNameForm";
import { OrderHistory } from "@/components/account/OrderHistory";
import { requireMember } from "@/lib/auth-guard";
import { listOrders } from "@/lib/orders";
import { getDisplayName } from "@/lib/profiles";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
export default function AccountPage(props: PageProps<"/account">) {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">Hesabım</h1>

      {/* Its own boundary rather than part of the one below: this line depends
          on the URL, the rest depends on the session, and neither should wait
          for the other. */}
      <Suspense fallback={null}>
        <ResetNotice searchParams={props.searchParams} />
      </Suspense>

      <Suspense fallback={<Placeholder />}>
        <Account />
      </Suspense>
    </section>
  );
}

// Where a finished password reset lands. Without this the reset ends on a page
// that looks exactly like an ordinary visit, leaving the member to guess
// whether the new password actually took.
async function ResetNotice({
  searchParams,
}: {
  searchParams: PageProps<"/account">["searchParams"];
}) {
  const { reset } = await searchParams;

  if (reset !== "ok") return null;

  return (
    <p
      role="status"
      className="mt-6 rounded-2xl border border-line bg-sand/60 px-5 py-4 text-sm leading-relaxed text-muted"
    >
      Şifreniz güncellendi. Bundan sonra hesabınıza yeni şifrenizle giriş
      yapabilirsiniz.
    </p>
  );
}

async function Account() {
  const { user, supabase } = await requireMember("/account");

  // One request, two independent reads.
  const [displayName, orders] = await Promise.all([
    getDisplayName(supabase, user.id),
    listOrders(supabase),
  ]);

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

      <OrderHistory orders={orders} />

      {/* Kept from the old panel: people expect a cart to follow the account. */}
      <p className="mt-6 text-sm leading-relaxed text-muted">
        Sepetiniz hesabınızdan bağımsızdır; kullandığınız cihazda saklanır.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/products"
          className="rounded-full bg-ink px-7 py-3 text-center text-sm tracking-wide text-cream transition-colors hover:bg-clay"
        >
          Bilekliklere göz at
        </Link>

        <form action={signOut}>
          <SubmitButton
            pendingLabel="Çıkış yapılıyor…"
            className="w-full rounded-full border border-line px-7 py-3 text-sm transition-colors hover:border-ink sm:w-auto disabled:text-muted"
          >
            Çıkış yap
          </SubmitButton>
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
