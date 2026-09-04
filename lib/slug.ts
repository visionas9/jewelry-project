// The readable half of a blog URL.
//
// Turkish is folded by hand rather than left to a Unicode normaliser. NFD
// decomposition handles ö and ü, but ı, İ, ş and ğ are their own letters rather
// than accented Latin ones — stripping combining marks leaves them behind, and
// a URL with a raw ı in it is one nobody can type. The map goes first, so the
// normaliser only ever sees what it can actually handle.
const TURKISH: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  i: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

// What a post gets when its title leaves nothing behind — all punctuation, or
// empty. An empty slug would be a URL that collides with the list page itself.
const FALLBACK = "yazi";

export function slugify(title: string): string {
  const folded = [...title]
    .map((character) => TURKISH[character] ?? character)
    .join("")
    // Anything still carrying an accent after the map above: é, â and friends.
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  const slug = folded
    // Everything that is not a letter, a digit or a hyphen becomes a
    // separator, so punctuation is dropped rather than percent-encoded.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug === "" ? FALLBACK : slug;
}
