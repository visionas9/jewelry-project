// Supabase speaks English. The shop speaks Turkish, and nothing else.
//
// Auth errors reach the visitor as-is unless they are translated here, so this
// is the one boundary where an English string is allowed to arrive and a
// Turkish one has to leave. Anything unrecognised falls back to a generic
// Turkish sentence rather than leaking the original — a visitor should never
// see "Invalid login credentials" on a Turkish page.

// Kept in one place because the form states it up front and the action enforces
// it. If these two ever disagree, the visitor is told one rule and judged by
// another. Matches `minimum_password_length` in supabase/config.toml.
export const MIN_PASSWORD_LENGTH = 6;

export const GENERIC_AUTH_ERROR =
  "Bir şeyler ters gitti. Lütfen birazdan tekrar deneyin.";

// Supabase's stable `code` field, which survives their wording changes. The
// human-readable `message` does not, so matching on codes first means a
// reworded Supabase release does not silently drop us to the fallback.
const BY_CODE: Record<string, string> = {
  user_already_exists:
    "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyebilirsiniz.",
  email_exists: "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyebilirsiniz.",
  weak_password: `Şifreniz çok zayıf. En az ${MIN_PASSWORD_LENGTH} karakter kullanın.`,
  // Deliberately vague, and deliberately identical whether the address exists
  // or not. Saying "no such account" would let anyone check which of their
  // customers shop here, one address at a time.
  invalid_credentials: "E-posta veya şifre hatalı.",
  invalid_login_credentials: "E-posta veya şifre hatalı.",
  email_address_invalid: "Geçerli bir e-posta adresi girin.",
  validation_failed: "Girdiğiniz bilgileri kontrol edin.",
  email_not_confirmed:
    "E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzu kontrol edin.",
  otp_expired:
    "Bağlantının süresi dolmuş. Yeni bir doğrulama e-postası isteyin.",
  over_email_send_rate_limit:
    "Çok fazla e-posta gönderildi. Lütfen birkaç dakika bekleyin.",
  over_request_rate_limit:
    "Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.",
  signup_disabled: "Şu anda yeni kayıt alınmıyor.",
  email_provider_disabled: "Şu anda yeni kayıt alınmıyor.",
};

// Older Supabase errors carry no code at all. Substring matching is a last
// resort before the fallback, not the primary path.
const BY_MESSAGE: [RegExp, string][] = [
  [/already registered|already exists/i, BY_CODE.user_already_exists],
  [/password.*(6|at least)|weak/i, BY_CODE.weak_password],
  [/invalid.*email|email.*invalid/i, BY_CODE.email_address_invalid],
  [/invalid login credentials|invalid credentials/i, BY_CODE.invalid_credentials],
  [/rate limit|too many/i, BY_CODE.over_request_rate_limit],
  [/expired/i, BY_CODE.otp_expired],
];

// Deliberately accepts `unknown`: callers pass whatever Supabase handed back,
// and a thrown network error is just as likely as a tidy AuthError.
export function turkishAuthError(error: unknown): string {
  if (!error || typeof error !== "object") return GENERIC_AUTH_ERROR;

  const { code, message } = error as { code?: unknown; message?: unknown };

  if (typeof code === "string" && BY_CODE[code]) return BY_CODE[code];

  if (typeof message === "string") {
    for (const [pattern, turkish] of BY_MESSAGE) {
      if (pattern.test(message)) return turkish;
    }
  }

  return GENERIC_AUTH_ERROR;
}
