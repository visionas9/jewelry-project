// One place to read the Supabase credentials.
//
// All three clients — the anonymous one, the browser one, and the per-request
// server one — point at the same project with the same public key. The only
// thing that differs between them is how they handle sessions.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY. Locally that means .env.local; on Vercel " +
      "it means Settings > Environment Variables, with Preview ticked as well " +
      "as Production — a variable scoped to Production only builds main and " +
      "fails every branch."
  );
}

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;
