import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { safeInternalPath } from "@/lib/safe-path";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "ishin denshin hesabınıza giriş yapın.",
};

export default function SignInPage(props: PageProps<"/signin">) {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">Giriş yapın</h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        Hesabınızla devam edin. Sepetiniz olduğu gibi kalır.
      </p>

      {/* Behind its own boundary, like the hidden field below and for the same
          reason: it depends on the URL, and reading that at the top of the
          page would make the heading wait for the request too. */}
      <Suspense fallback={null}>
        <GuardNotice searchParams={props.searchParams} />
      </Suspense>

      {/* The form itself is the same for everyone, so it stays in the static
          shell. Only the one hidden field that depends on the URL waits for
          the request — reading `next` up here would have made the whole page,
          heading and all, wait with it. */}
      <SignInForm>
        <Suspense fallback={null}>
          <ReturnField searchParams={props.searchParams} />
        </Suspense>
      </SignInForm>
    </section>
  );
}

// Why someone is looking at this page when they did not ask for it.
//
// A `next` in the URL means the guard sent them: they were reaching for a page
// that belongs to a member. The commonest way to arrive here is the one that
// looks broken without a word of explanation — confirming an email or
// finishing a password reset on a phone, then coming back to the laptop that
// started it. That laptop is not signed in and cannot be, because the session
// is a cookie on the phone.
async function GuardNotice({
  searchParams,
}: {
  searchParams: PageProps<"/signin">["searchParams"];
}) {
  const next = safeInternalPath((await searchParams).next);

  if (!next) return null;

  // Somebody sent here on the way to buying something is not signing in, they
  // are on step one of three. Saying so is the difference between an
  // interruption and a journey — and it is only true for that one destination,
  // so an ordinary sign-in still looks like an ordinary sign-in.
  const buying = next === "/checkout";

  return (
    <>
      {buying ? <CheckoutSteps current={1} /> : null}

      <p
        role="status"
        className="mt-6 rounded-2xl border border-line bg-sand/60 px-5 py-4 text-sm leading-relaxed text-muted"
      >
        {buying
          ? "Siparişinizi tamamlamak için giriş yapın. Sepetiniz olduğu gibi kalır."
          : "Devam etmek için bu tarayıcıda giriş yapmanız gerekiyor."}
      </p>
    </>
  );
}

// Where to go after signing in, carried through the form rather than kept in
// the action's memory: a Server Action gets a fresh request and remembers
// nothing about the page that rendered the form.
async function ReturnField({
  searchParams,
}: {
  searchParams: PageProps<"/signin">["searchParams"];
}) {
  // Validated here as well as in the action. This one keeps a hostile value
  // from being echoed back into the page at all; the action's check is the one
  // that actually decides where the visitor is sent.
  const next = safeInternalPath((await searchParams).next);

  if (!next) return null;

  return <input type="hidden" name="next" value={next} />;
}
