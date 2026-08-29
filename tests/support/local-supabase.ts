import { execFileSync } from "node:child_process";

/**
 * Reads the connection details of the running local Supabase stack.
 *
 * `supabase status -o env` prints them as KEY="value" lines. Asking the CLI
 * beats hardcoding ports and keys: the suite then follows whatever
 * supabase/config.toml is actually using.
 */
export function localSupabaseEnv(): Record<string, string> {
  let output: string;

  try {
    output = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error(
      "Local Supabase is not running. Start it with `supabase start` " +
        "(it needs Docker), then run the tests again."
    );
  }

  const entries = output
    .split("\n")
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => {
      const separator = line.indexOf("=");
      const key = line.slice(0, separator);
      const value = line.slice(separator + 1).replace(/^"|"$/g, "");
      return [key, value] as const;
    });

  return Object.fromEntries(entries);
}
