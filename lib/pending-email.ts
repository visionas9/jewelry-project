// The address someone typed on the sign-up form, handed along to the sign-in
// form so they do not have to type it a second time.
//
// sessionStorage rather than a query string: an email in the URL ends up in
// browser history and in every server log that records the path, which is a lot
// of places for a customer's address to sit in exchange for saving one field.
// It lives for the tab and no longer.
const KEY = "ishin-denshin-pending-email";

export function rememberPendingEmail(email: string) {
  try {
    sessionStorage.setItem(KEY, email);
  } catch {
    // Private browsing and blocked site data both throw here. Prefilling is a
    // courtesy, so there is nothing to recover — the visitor types it in.
  }
}

// Reads it once and drops it. Coming back to the sign-in page later should not
// keep re-filling an address from a sign-up that already finished.
export function takePendingEmail(): string | null {
  try {
    const email = sessionStorage.getItem(KEY);
    if (email) sessionStorage.removeItem(KEY);
    return email;
  } catch {
    return null;
  }
}
