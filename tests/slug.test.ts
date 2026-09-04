import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/slug";

// A slug is the readable half of a URL, and this shop writes in Turkish. Folded
// wrong, "Taşın Hikâyesi" becomes something nobody would type or trust.

describe("turning a title into a slug", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Stone Care Guide")).toBe("stone-care-guide");
  });

  it("folds Turkish letters to their plain forms", () => {
    expect(slugify("Taşın Hikâyesi")).toBe("tasin-hikayesi");
    expect(slugify("Gümüş ve Çelik")).toBe("gumus-ve-celik");
    expect(slugify("Iğdır İzmir")).toBe("igdir-izmir");
  });

  it("drops punctuation rather than encoding it", () => {
    expect(slugify("Bakım: nasıl?")).toBe("bakim-nasil");
    expect(slugify("Yüzde 100 doğal!")).toBe("yuzde-100-dogal");
  });

  it("collapses runs of separators and trims the ends", () => {
    expect(slugify("  bir   iki  ")).toBe("bir-iki");
    expect(slugify("--bir--iki--")).toBe("bir-iki");
  });

  it("gives something usable for a title with nothing left in it", () => {
    // A title of pure punctuation would otherwise produce an empty slug, and
    // an empty slug is a URL that collides with the list page.
    expect(slugify("???")).not.toBe("");
    expect(slugify("")).not.toBe("");
  });
});
