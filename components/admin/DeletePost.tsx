"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { deletePost, type PostResult } from "@/app/admin/blog/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

// Deleting, kept away from the save button and folded shut, the same way
// cancelling an order is. Nothing here is reversible, so it should never be the
// thing pressed by reflex.
export function DeletePost({ id }: { id: number }) {
  const router = useRouter();
  const [state, formAction] = useActionState<PostResult, FormData>(
    deletePost.bind(null, id),
    null
  );

  useEffect(() => {
    if (state?.ok) router.push("/admin/blog");
  }, [state, router]);

  return (
    <details className="mt-10 border-t border-line pt-5">
      <summary className="cursor-pointer list-none text-sm text-muted hover:text-ink">
        Yazıyı sil
      </summary>
      <div className="mt-4">
        <p className="text-sm leading-relaxed text-muted">
          Silinen yazı geri getirilemez ve adresi artık çalışmaz. Paylaştıysanız
          o bağlantı kırılır.
        </p>
        <p
          role="alert"
          className={`mt-2 text-sm text-clay ${state && !state.ok ? "" : "sr-only"}`}
        >
          {state?.ok === false ? state.message : ""}
        </p>
        <form action={formAction} className="mt-4">
          <SubmitButton
            pendingLabel="Siliniyor…"
            className="w-full rounded-full border border-clay/50 px-7 py-3 text-sm tracking-wide text-clay transition-colors hover:bg-clay/10 disabled:border-line disabled:text-muted"
          >
            Kalıcı olarak sil
          </SubmitButton>
        </form>
      </div>
    </details>
  );
}
