import { execFileSync } from "node:child_process";

import { localSupabaseEnv } from "./local-supabase";

/**
 * Rebuilds the test database once, before the suite runs: drops it, replays
 * supabase/migrations in order, then loads supabase/seed.sql.
 *
 * This is what makes the tests meaningful. The schema and the RLS policies
 * under test come from the repo on every run, so a policy that was only ever
 * clicked into the dashboard would fail here rather than pass by accident.
 */
export default function setup(): void {
  // Throws with a readable message if the stack is down — better than letting
  // `db reset` fail with a Docker error.
  localSupabaseEnv();

  execFileSync("supabase", ["db", "reset", "--local"], { stdio: "inherit" });
}
