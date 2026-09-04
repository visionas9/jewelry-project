import { beforeAll, describe, expect, it } from "vitest";

import { supabase as anonymous } from "@/lib/supabase";
import { adminClient, createMember, makeAdmin, type Member } from "./support/accounts";

// The blog is the one thing on the site the shop writes and everybody reads.
// So: readable by anyone, writable by the administrator alone — and enforced by
// the database, not by whichever page happens to be rendering.

let hilal: Member;
let ayse: Member;

beforeAll(async () => {
  hilal = await createMember("yonetici-blog@example.com", "cok-gizli-parola-20");
  ayse = await createMember("musteri-blog@example.com", "cok-gizli-parola-21");

  await makeAdmin(hilal);
});

const post = {
  slug: "tasin-hikayesi",
  title: "Taşın Hikâyesi",
  body: "Her taşın kendi hikâyesi var.",
  cover_image: null,
};

describe("who can write a post", () => {
  it("lets the administrator create one", async () => {
    const { data, error } = await hilal.client
      .from("posts")
      .insert({ ...post, slug: "yonetici-yazisi" })
      .select("slug, title")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.title).toBe("Taşın Hikâyesi");
  });

  it("lets the administrator edit and delete one", async () => {
    await hilal.client.from("posts").insert({ ...post, slug: "duzenlenecek" });

    const { error: updateError } = await hilal.client
      .from("posts")
      .update({ title: "Yeni Başlık" })
      .eq("slug", "duzenlenecek");

    expect(updateError).toBeNull();

    const { error: deleteError } = await hilal.client
      .from("posts")
      .delete()
      .eq("slug", "duzenlenecek");

    expect(deleteError).toBeNull();
  });

  it("refuses an ordinary member", async () => {
    const { error } = await ayse.client
      .from("posts")
      .insert({ ...post, slug: "uye-yazisi" });

    expect(error).not.toBeNull();
  });

  it("refuses a signed-out visitor", async () => {
    const { error } = await anonymous
      .from("posts")
      .insert({ ...post, slug: "ziyaretci-yazisi" });

    expect(error).not.toBeNull();
  });

  it("refuses a member editing what she wrote", async () => {
    await adminClient().from("posts").insert({ ...post, slug: "korunan" });

    const { error } = await ayse.client
      .from("posts")
      .update({ title: "Ele geçirildi" })
      .eq("slug", "korunan");

    const { data } = await anonymous
      .from("posts")
      .select("title")
      .eq("slug", "korunan")
      .maybeSingle();

    // Either refused outright, or silently matching no rows — never actually
    // changed.
    if (!error) expect(data?.title).toBe("Taşın Hikâyesi");
  });
});

describe("who can read a post", () => {
  it("lets a signed-out visitor read them", async () => {
    await adminClient().from("posts").insert({ ...post, slug: "herkese-acik" });

    const { data, error } = await anonymous
      .from("posts")
      .select("slug, title, body")
      .eq("slug", "herkese-acik")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.title).toBe("Taşın Hikâyesi");
  });
});

describe("the slug", () => {
  it("cannot be used twice", async () => {
    await adminClient().from("posts").insert({ ...post, slug: "tekil" });

    const { error } = await hilal.client
      .from("posts")
      .insert({ ...post, slug: "tekil" });

    // A duplicate slug would be two posts at one URL.
    expect(error?.code).toBe("23505");
  });
});
