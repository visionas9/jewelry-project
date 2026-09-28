import { describe, expect, it } from "vitest";

import { validateDelivery } from "@/lib/delivery";
import { PROVINCES } from "@/lib/provinces";

const complete = {
  fullName: "Ayşe Yılmaz",
  phone: "0532 111 22 33",
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

// The shop ships inside Turkey only. What decides that is where the parcel
// goes, so the address and the courier's phone number have to be Turkish —
// not the visitor, who may be ordering for family from abroad.
describe("delivering inside Turkey only", () => {
  it("knows all 81 provinces, once each", () => {
    expect(PROVINCES).toHaveLength(81);
    expect(new Set(PROVINCES).size).toBe(81);
    expect(PROVINCES).toContain("İstanbul");
    expect(PROVINCES).toContain("Iğdır");
  });

  it("accepts every province", () => {
    for (const city of PROVINCES) {
      expect(validateDelivery({ ...complete, city }).city).toBeUndefined();
    }
  });

  it("rejects a city outside Turkey", () => {
    for (const city of ["Warszawa", "Berlin", "istanbul "]) {
      expect(validateDelivery({ ...complete, city }).city).toBeTruthy();
    }
  });

  it("accepts a Turkish mobile or landline, with or without the country code", () => {
    for (const phone of [
      "0532 111 22 33",
      "532 111 22 33",
      "+90 532 111 22 33",
      "0090 532 111 22 33",
      "0216 111 22 33",
    ]) {
      expect(validateDelivery({ ...complete, phone }).phone).toBeUndefined();
    }
  });

  it("rejects a number from another country", () => {
    for (const phone of [
      "+48 512 345 678", // Poland
      "+49 30 12345678", // Germany
      "+1 212 555 1234", // United States
      "0850 111 22 33", // a Turkish business line, which no courier can text
    ]) {
      expect(validateDelivery({ ...complete, phone }).phone).toBeTruthy();
    }
  });
});
