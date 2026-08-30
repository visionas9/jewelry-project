import { describe, expect, it } from "vitest";

import {
  GENERIC_AUTH_ERROR,
  MIN_PASSWORD_LENGTH,
  turkishAuthError,
} from "@/lib/auth-errors";

// The site is Turkish-only. The one thing that must never happen is an English
// Supabase string reaching a visitor, so these tests care less about which
// Turkish sentence comes back than about the guarantee that one always does.

const isTurkish = (text: string) => /[çğıöşüÇĞİÖŞÜ]/.test(text);

describe("translating Supabase auth errors", () => {
  it("maps a known code to Turkish", () => {
    const message = turkishAuthError({ code: "user_already_exists" });

    expect(message).toContain("zaten kayıtlı");
    expect(isTurkish(message)).toBe(true);
  });

  it("falls back to the message when no code is present", () => {
    const message = turkishAuthError({ message: "User already registered" });

    expect(message).toContain("zaten kayıtlı");
  });

  it("prefers the code over the message when both are present", () => {
    const message = turkishAuthError({
      code: "weak_password",
      message: "User already registered",
    });

    expect(message).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it("says the same thing for a wrong password and a missing account", () => {
    // Sign-in must not become an oracle for which addresses have accounts
    // here. Supabase returns the same code for both, and the mapping has to
    // keep it that way.
    const wrongPassword = turkishAuthError({ code: "invalid_credentials" });
    const noSuchAccount = turkishAuthError({
      message: "Invalid login credentials",
    });

    expect(wrongPassword).toBe(noSuchAccount);
    expect(wrongPassword).toBe("E-posta veya şifre hatalı.");
    expect(wrongPassword).not.toMatch(/kayıtlı|bulunamadı/);
  });

  it("never leaks an unrecognised English string", () => {
    const message = turkishAuthError({
      code: "some_code_supabase_added_last_week",
      message: "Something went terribly wrong on our end",
    });

    expect(message).toBe(GENERIC_AUTH_ERROR);
    expect(message).not.toContain("terribly");
  });

  it.each([null, undefined, "not an error", 42, {}])(
    "returns the Turkish fallback for %p",
    (input) => {
      expect(turkishAuthError(input)).toBe(GENERIC_AUTH_ERROR);
    }
  );
});
