import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetRequestForm } from "@/components/auth/ResetRequestForm";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "ishin denshin hesabınızın şifresini sıfırlayın.",
};

// Same shape as /signup: the heading and the form are identical for every
// visitor and stay in the static shell. Only the notice depends on the URL,
// and it sits behind its own Suspense boundary — reading searchParams up here
// would make the whole page wait for the request for the sake of one line that
// is almost never shown.
export default function ForgotPasswordPage(
  props: PageProps<"/forgot-password">
) {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">Şifrenizi sıfırlayın</h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        Hesabınızın e-posta adresini yazın. Yeni bir şifre belirlemeniz için
        size bir bağlantı gönderelim.
      </p>

      <Suspense fallback={null}>
        <LinkNotice searchParams={props.searchParams} />
      </Suspense>

      <ResetRequestForm />
    </section>
  );
}

// Where a dead reset link lands. The message has to be specific enough that
// someone who just clicked a link understands why nothing happened — "geçersiz
// bağlantı" on its own reads like the site is broken.
async function LinkNotice({
  searchParams,
}: {
  searchParams: PageProps<"/forgot-password">["searchParams"];
}) {
  const { error } = await searchParams;

  if (error !== "invalid-link") return null;

  return (
    <p
      role="alert"
      className="mt-6 rounded-2xl border border-line bg-sand/60 px-5 py-4 text-sm leading-relaxed text-muted"
    >
      Şifre sıfırlama bağlantısının süresi dolmuş ya da bağlantı daha önce
      kullanılmış. Aşağıdan yeni bir bağlantı isteyebilirsiniz.
    </p>
  );
}
