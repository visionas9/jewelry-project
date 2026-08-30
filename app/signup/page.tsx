import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description:
    "ishin denshin hesabı oluşturun. Siparişlerinizi takip edin, sepetiniz sizi beklesin.",
};

// The heading and the form are the same for every visitor, so they stay in the
// static shell. Only the notice depends on the URL, and it sits behind its own
// Suspense boundary — otherwise reading searchParams would make the whole page
// dynamic for the sake of one line that is almost never shown.
export default function SignUpPage(props: PageProps<"/signup">) {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">Hesap oluşturun</h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        Hesap açmak zorunlu değil — dilediğiniz gibi gezebilir, sepetinizi
        doldurabilirsiniz.
      </p>

      <Suspense fallback={null}>
        <LinkNotice searchParams={props.searchParams} />
      </Suspense>

      <SignUpForm />
    </section>
  );
}

async function LinkNotice({
  searchParams,
}: {
  searchParams: PageProps<"/signup">["searchParams"];
}) {
  const { error } = await searchParams;

  if (error !== "invalid-link") return null;

  return (
    <p
      role="alert"
      className="mt-6 rounded-2xl border border-line bg-sand/60 px-5 py-4 text-sm leading-relaxed text-muted"
    >
      Doğrulama bağlantısı geçersiz ya da süresi dolmuş. Aşağıdan tekrar kayıt
      olabilir veya yeni bir doğrulama e-postası isteyebilirsiniz.
    </p>
  );
}
