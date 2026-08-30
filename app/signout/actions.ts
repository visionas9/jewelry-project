"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabase } from "@/lib/supabase-server";

export async function signOut() {
  const supabase = await createServerSupabase();

  // Scope "local" ends this browser's session only. The default would end
  // every session the member has, signing them out of their phone because
  // they signed out on a laptop.
  await supabase.auth.signOut({ scope: "local" });

  // Without this, the back button can serve a cached render from while they
  // were signed in. The cookie is gone, so nothing privileged is reachable,
  // but the page would still look signed in — which is its own kind of lie.
  revalidatePath("/", "layout");
  redirect("/");
}
