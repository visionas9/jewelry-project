import { describe, expect, it } from "vitest";

import { BANK } from "@/lib/bank";
import { buyerOrderEmail, shopOrderEmail } from "@/lib/order-emails";

const order = {
  code: "IS-00042",
  total: 2500,
  fullName: "Ayşe Yılmaz",
  phone: "0500 111 22 33",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Caferağa Mah. Örnek Sok. No 3 D 5",
  lines: [
    { name: "Rose Quartz Bileklik", quantity: 2, unitPrice: 1000 },
    { name: "Lapis Blue Bileklik", quantity: 1, unitPrice: 500 },
  ],
};

describe("the email the buyer gets", () => {
  it("carries the code and what to transfer", () => {
    const mail = buyerOrderEmail(order);

    // The code is the transfer reference, so it belongs in the subject too —
    // that is what makes the thread findable later.
    expect(mail.subject).toContain("IS-00042");
    expect(mail.html).toContain(BANK.iban);
    expect(mail.html).toContain(BANK.accountHolder);
    expect(mail.html).toContain("2.500");
  });

  it("names every line", () => {
    const mail = buyerOrderEmail(order);

    expect(mail.html).toContain("Rose Quartz Bileklik");
    expect(mail.html).toContain("Lapis Blue Bileklik");
  });
});

describe("the email the shop gets", () => {
  it("carries everything needed to send the parcel", () => {
    const mail = shopOrderEmail(order);

    expect(mail.subject).toContain("IS-00042");
    expect(mail.html).toContain("Ayşe Yılmaz");
    expect(mail.html).toContain("0500 111 22 33");
    expect(mail.html).toContain("Kadıköy");
    expect(mail.html).toContain("Rose Quartz Bileklik");
    expect(mail.html).toContain("2.500");
  });

  it("does not carry the bank details", () => {
    // She knows her own IBAN. Repeating it in every notification is one more
    // place for it to be wrong.
    expect(shopOrderEmail(order).html).not.toContain(BANK.iban);
  });
});

describe("anything a customer typed", () => {
  it("cannot break out of the email's markup", () => {
    const mail = shopOrderEmail({
      ...order,
      fullName: '<img src=x onerror="alert(1)">',
      address: "Mahalle & Sokak <b>1</b>",
    });

    expect(mail.html).not.toContain("<img");
    expect(mail.html).not.toContain("<b>1</b>");
    expect(mail.html).toContain("&amp;");
  });
});
