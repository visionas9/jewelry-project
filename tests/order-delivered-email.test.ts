import { describe, expect, it } from "vitest";

import { BANK } from "@/lib/bank";
import { orderDeliveredEmail } from "@/lib/order-emails";

// The last email an order sends: it arrived. Pure, like the others.

const order = {
  code: "IS-00042",
  total: 2500,
  fullName: "Ayşe Yılmaz",
  lines: [{ name: "Rose Quartz Bileklik", quantity: 2, unitPrice: 1000 }],
};

describe("the email when it has arrived", () => {
  it("names the order and confirms the delivery", () => {
    const mail = orderDeliveredEmail(order);

    expect(mail.subject).toContain("IS-00042");
    expect(mail.html).toContain("Ayşe Yılmaz");
    expect(mail.html).toContain("teslim");
  });

  it("says what to do if something is wrong", () => {
    // The one thing this email has to earn: somebody opening a parcel that is
    // broken or wrong should not have to hunt for how to say so.
    expect(orderDeliveredEmail(order).html).toContain("merhaba@");
  });

  it("does not ask for money", () => {
    expect(orderDeliveredEmail(order).html).not.toContain(BANK.iban);
  });
});

describe("anything a customer typed", () => {
  it("cannot break out of the markup", () => {
    const mail = orderDeliveredEmail({
      ...order,
      fullName: '<img src=x onerror="alert(1)">',
      lines: [{ name: "Mahalle & <b>Taş</b>", quantity: 1, unitPrice: 100 }],
    });

    expect(mail.html).not.toContain("<img");
    expect(mail.html).not.toContain("<b>Taş</b>");
    expect(mail.html).toContain("&amp;");
  });
});
