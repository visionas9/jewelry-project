// What a member may call themselves.
//
// The point of a display name is that later reviews and comments can name
// somebody without naming their inbox, so the rules here are mostly about
// keeping the value fit to print next to a member's words.

export const MAX_DISPLAY_NAME_LENGTH = 40;
export const MIN_DISPLAY_NAME_LENGTH = 2;

export type DisplayName =
  // `null` is a member clearing their name, not a failure — they are back to
  // being unnamed, which is where every account starts.
  | { ok: true; value: string | null }
  | { ok: false; message: string };

export function normalizeDisplayName(value: unknown): DisplayName {
  if (typeof value !== "string") {
    return { ok: false, message: "Görünen adınızı kontrol edin." };
  }

  // A name pasted out of a document arrives with whatever whitespace came with
  // it. Runs collapse to one space so "Ayşe   Y." and "Ayşe Y." are not two
  // different names that look identical on screen.
  const name = value.replace(/\s+/g, " ").trim();

  if (name === "") return { ok: true, value: null };

  // Counted in code points, not UTF-16 units: an emoji is two units, and
  // charging someone two characters for one thing they typed is wrong.
  const length = [...name].length;

  if (length < MIN_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      message: `Görünen ad en az ${MIN_DISPLAY_NAME_LENGTH} karakter olmalıdır.`,
    };
  }

  if (length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      message: `Görünen ad en fazla ${MAX_DISPLAY_NAME_LENGTH} karakter olabilir.`,
    };
  }

  // The whole reason this field exists is so a member's address never appears
  // beside their words. Someone typing it in here anyway would undo that, and
  // no actual name contains an @.
  if (name.includes("@")) {
    return {
      ok: false,
      message: "Görünen ad bir e-posta adresi olamaz.",
    };
  }

  // Zero-width and direction-override characters are invisible on screen but
  // very much there: they let one member's name imitate another's, or reverse
  // the text around it.
  //
  // The byte order mark is deliberately absent from this list. JavaScript
  // counts it as whitespace, so the collapse above has already turned it into
  // a space by the time anything gets here — listing it would look like a check
  // while never once being the reason a name was refused.
  if (/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e]/.test(name)) {
    return { ok: false, message: "Görünen adınızı kontrol edin." };
  }

  return { ok: true, value: name };
}
