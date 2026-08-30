import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "ishin denshin hesabınıza giriş yapın.",
};

export default function SignInPage() {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">Giriş yapın</h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        Hesabınızla devam edin. Sepetiniz olduğu gibi kalır.
      </p>

      <SignInForm />
    </section>
  );
}
