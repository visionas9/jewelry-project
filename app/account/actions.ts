"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { GENERIC_AUTH_ERROR } from "@/lib/auth-errors";
import { normalizeDisplayName } from "@/lib/display-name";
import { setDisplayName } from "@/lib/profiles";
import { createServerSupabase } from "@/lib/supabase-server";

export type DisplayNameState = { ok: boolean; message: string } | null;

export async function updateDisplayName(
  _previous: DisplayNameState,
  formData: FormData
): Promise<DisplayNameState> {
  const result = normalizeDisplayName(formData.get("displayName"));

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  const supabase = await createServerSupabase();

  // Re-established here rather than trusted from the page. A Server Action is
  // a public POST endpoint: whoever calls it decides what the form said, but
  // not who they are.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin?next=%2Faccount");

  // No id travels in the form, so there is nothing here to tamper with. The
  // row written is the one belonging to the verified session, and the update
  // policy re-checks that in the database regardless.
  const outcome = await setDisplayName(supabase, user.id, result.value);

  if (outcome !== "saved") {
    // Both failures are the shop's to fix, not the member's, so they read the
    // same sentence either way. The difference is in the log: "no-profile"
    // means the row the sign-up trigger should have created is not there, which
    // is a database that has fallen behind the migrations rather than a query
    // that went wrong.
    if (outcome === "no-profile") {
      console.error("profiles: no profile row for member", user.id);
    }

    return { ok: false, message: GENERIC_AUTH_ERROR };
  }

  // The page renders the name it just saved, so the cached render is stale.
  revalidatePath("/account");

  return {
    ok: true,
    message:
      result.value === null
        ? "Görünen adınız kaldırıldı."
        : "Görünen adınız kaydedildi.",
  };
}
