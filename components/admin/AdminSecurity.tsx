"use client";

import { useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type Enrolling = { factorId: string; qr: string };

const FIELD =
  "w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base tracking-[0.3em] outline-none focus:border-ink";

// Enrolling an authenticator app, and answering its challenge.
//
// All of this runs in the browser because it needs the QR code on screen and
// the session in hand. Nothing here decides anything: the database is what
// refuses a session that has not passed a factor.
export function AdminSecurity({
  aal,
  factorId,
  deviceCount,
}: {
  aal: string;
  // The factor to answer a challenge with, or null if there is none yet. Read
  // on the server, where the session already is.
  factorId: string | null;
  deviceCount: number;
}) {
  const [supabase] = useState(() => createBrowserSupabase());
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startEnrolment() {
    setBusy(true);
    setError(null);

    // An enrolment that was started and abandoned leaves an unverified factor
    // behind, and Supabase refuses a second one with the same name. Clearing
    // those first is what stops "I closed the tab" turning into a permanent
    // failure. Verified factors are never touched.
    const { data: existing } = await supabase.auth.mfa.listFactors();

    for (const factor of existing?.all ?? []) {
      if (factor.status !== "verified") {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Cihaz ${new Date().toLocaleString("tr-TR")}`,
    });

    setBusy(false);

    if (error || !data) {
      setError("Kurulum başlatılamadı. Lütfen tekrar deneyin.");
      return;
    }

    setEnrolling({ factorId: data.id, qr: data.totp.qr_code });
  }

  async function submitCode(factorId: string) {
    setBusy(true);
    setError(null);

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.replace(/\s/g, ""),
    });

    setBusy(false);

    if (error) {
      setError("Kod doğrulanamadı. Uygulamadaki güncel kodu girin.");
      return;
    }

    // The session is stronger now, and every server check reads it from the
    // cookie — so the page has to come back from the server, not re-render.
    window.location.reload();
  }

  const verified = factorId !== null;

  return (
    <div className="mt-8 flex flex-col gap-6">
      <p
        role="alert"
        className={`text-sm text-brass ${error ? "" : "sr-only"}`}
      >
        {error ?? ""}
      </p>

      {/* Signed in with a password, with a factor already set up: the code is
          the only thing standing between here and the panel. */}
      {verified && aal !== "aal2" ? (
        <section className="rounded-2xl border border-line bg-sand/60 px-5 py-6">
          <h2 className="font-display text-xl">Doğrulama kodu</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Uygulamanızdaki altı haneli kodu girin.
          </p>

          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={`${FIELD} mt-4`}
            placeholder="000000"
          />

          <button
            type="button"
            disabled={busy || code.length < 6}
            onClick={() => submitCode(factorId!)}
            className="mt-4 w-full rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass disabled:bg-line disabled:text-muted"
          >
            {busy ? <Busy label="Doğrulanıyor…" /> : "Doğrula"}
          </button>
        </section>
      ) : null}

      {verified && aal === "aal2" ? (
        <section className="rounded-2xl border border-line px-5 py-6">
          <h2 className="font-display text-xl">Doğrulandı</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Bu oturum ikinci adımı geçti. Kayıtlı cihaz: {deviceCount}.
          </p>
        </section>
      ) : null}

      {/* A second device is not a nicety: it is the difference between a lost
          phone and a lost account. */}
      {enrolling ? (
        <section className="rounded-2xl border border-line px-5 py-6">
          <h2 className="font-display text-xl">Yeni cihaz ekleyin</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Kodu doğrulama uygulamanızla okutun, ardından uygulamadaki altı
            haneli kodu girin.
          </p>

          {/* Supabase returns the QR as a data URI, so it is an image source
              rather than markup to inject. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrolling.qr}
            alt="Doğrulama uygulaması için QR kodu"
            className="mt-4 h-44 w-44"
          />

          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={`${FIELD} mt-4`}
            placeholder="000000"
          />

          <button
            type="button"
            disabled={busy || code.length < 6}
            onClick={() => submitCode(enrolling.factorId)}
            className="mt-4 w-full rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass disabled:bg-line disabled:text-muted"
          >
            {busy ? <Busy label="Doğrulanıyor…" /> : "Cihazı doğrula"}
          </button>
        </section>
      ) : verified && aal !== "aal2" ? null : (
        <button
          type="button"
          disabled={busy}
          onClick={startEnrolment}
          className="self-start rounded-full border border-line px-7 py-3 text-sm transition-colors hover:border-ink disabled:text-muted"
        >
          {busy ? <Busy label="Hazırlanıyor…" /> : verified ? "Başka bir cihaz ekle" : "Doğrulama uygulaması ekle"}
        </button>
      )}
    </div>
  );
}

function Busy({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner />
      {label}
    </span>
  );
}
