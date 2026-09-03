import { describe, expect, it } from "vitest";

import { BANK } from "@/lib/bank";
import { orderPaidEmail, orderShippedEmail } from "@/lib/order-emails";

// The two emails an order sends as it moves: the money arrived, and it is on
// its way. Pure functions, so these are plain assertions about the markup —
// nothing here sends anything.

const order = {
  code: "IS-00042",
  total: 2500,
  fullName: "Ayşe Yılmaz",
  lines: [
    { name: "Rose Quartz Bileklik", quantity: 2, unitPrice: 1000 },
    { name: "Lapis Blue Bileklik", quantity: 1, unitPrice: 500 },
  ],
};

const shipment = { carrier: "Yurtiçi Kargo", trackingNumber: "1234567890" };

describe("the email when the money has arrived", () => {
  it("names the order and says it is being prepared", () => {
    const mail = orderPaidEmail(order);

    expect(mail.subject).toContain("IS-00042");
    expect(mail.html).toContain("Ayşe Yılmaz");
    expect(mail.html).toContain("hazırl");
  });

  it("does not ask for money again", () => {
    // The transfer has landed. Repeating the IBAN here is how somebody pays
    // twice.
    expect(orderPaidEmail(order).html).not.toContain(BANK.iban);
  });
});

describe("the email when it has shipped", () => {
  it("carries the carrier and the tracking number", () => {
    const mail = orderShippedEmail(order, shipment);

    expect(mail.subject).toContain("IS-00042");
    expect(mail.html).toContain("Yurtiçi Kargo");
    expect(mail.html).toContain("1234567890");
  });

  it("points back at the order page", () => {
    expect(orderShippedEmail(order, shipment).html).toContain("/orders/IS-00042");
  });
});

describe("anything typed by hand", () => {
  it("cannot break out of either email's markup", () => {
    const hostile = {
      ...order,
      fullName: '<img src=x onerror="alert(1)">',
      lines: [{ name: "Mahalle & <b>Taş</b>", quantity: 1, unitPrice: 100 }],
    };

    for (const mail of [
      orderPaidEmail(hostile),
      orderShippedEmail(hostile, shipment),
    ]) {
      expect(mail.html).not.toContain("<img");
      expect(mail.html).not.toContain("<b>Taş</b>");
      expect(mail.html).toContain("&amp;");
    }
  });

  it("escapes the carrier and tracking number too", () => {
    // These come from the panel rather than a customer, but they are still
    // typed into a form by hand, and the same rule costs nothing.
    const mail = orderShippedEmail(order, {
      carrier: "<b>Kargo</b>",
      trackingNumber: '"><script>alert(1)</script>',
    });

    expect(mail.html).not.toContain("<script>");
    expect(mail.html).not.toContain("<b>Kargo</b>");
  });
});
