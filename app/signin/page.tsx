import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";
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
