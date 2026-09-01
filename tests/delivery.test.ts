import { describe, expect, it } from "vitest";

import { validateDelivery } from "@/lib/delivery";

const complete = {
  fullName: "Ayşe Yılmaz",
  phone: "0500 111 22 33",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Caferağa Mah. Örnek Sok. No 3 D 5",
};

describe("checking delivery details", () => {
  it("passes a complete address", () => {
    expect(validateDelivery(complete)).toEqual({});
  });

  it("names every missing field at once", () => {
    const errors = validateDelivery({ ...complete, city: "", district: "" });

    // Not just the first one: being sent back twice for two blank fields is
    // how somebody gives up on a checkout.
    expect(Object.keys(errors).sort()).toEqual(["city", "district"]);
    expect(errors.city).toContain("İl");
    expect(errors.district).toContain("İlçe");
  });

  it("accepts a phone number written however somebody writes it", () => {
    for (const phone of ["05001112233", "0500 111 22 33", "(0500) 111-22-33"]) {
      expect(validateDelivery({ ...complete, phone }).phone).toBeUndefined();
    }
  });

  it("rejects a phone number too short to be one", () => {
    expect(validateDelivery({ ...complete, phone: "0500 111" }).phone).toBeTruthy();
  });
});
