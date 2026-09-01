import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminSecurity } from "@/components/admin/AdminSecurity";
import { requireAdminAccount } from "@/lib/admin-guard";

export const metadata: Metadata = {
  title: "Güvenlik",
  robots: { index: false, follow: false },
};

// Nothing outside the boundary says anything: the shell of this page has to be
// as uninformative as a 404, because that is what everybody else gets.
export default function AdminSecurityPage() {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <Suspense fallback={null}>
        <Security />
      </Suspense>
    </section>
  );
}

async function Security() {
  const supabase = await requireAdminAccount();

  // The session's assurance level decides what this page offers: a code to
  // type, or a device to add. Supabase works it out from the token rather than
  // us reading the claim by hand.
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  const aal = assurance?.currentLevel ?? "aal1";

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verified = factors?.totp ?? [];

  return (
    <>
      <h1 className="font-display text-3xl md:text-4xl">Güvenlik</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Panele girmek için şifrenizin yanında doğrulama uygulamanızdaki kod da
        gerekir.
      </p>

      <AdminSecurity
        aal={aal}
        factorId={verified[0]?.id ?? null}
        deviceCount={verified.length}
      />
    </>
  );
}
