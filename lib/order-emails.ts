import { BANK } from "./bank";
import { formatPrice } from "./format";
import { SITE } from "./site";

// What the two order emails say. Pure: given an order, they return a subject
// and a body, and nothing here knows how mail is sent.

export type OrderEmailLine = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type OrderForEmail = {
  code: string;
  total: number;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  lines: OrderEmailLine[];
};

export type Email = { subject: string; html: string };

// Everything below is written by a customer, so it is escaped before it reaches
// the markup. An address field is as good a place to put a <script> as any.
function escape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const WRAP = (body: string) => `<!doctype html>
<html lang="tr">
  <body style="margin:0;padding:0;background:#faf8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:40px 32px;">
          <tr><td style="font-size:18px;letter-spacing:0.08em;color:#1a1a1a;padding-bottom:32px;">ishin denshin</td></tr>
          ${body}
          <tr><td style="border-top:1px solid #ececec;padding-top:24px;font-size:13px;line-height:1.7;color:#9a9a9a;">
            ishin denshin — doğal taşlarla elde hazırlanan bileklikler<br />
            <a href="${SITE.url}" style="color:#9a9a9a;">ishindenshinstore.com</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const row = (label: string, value: string) => `
  <tr><td style="font-size:14px;line-height:1.7;color:#3d3d3d;padding-bottom:4px;">
    <span style="color:#6b6b6b;">${label}:</span> ${value}
  </td></tr>`;

function lineList(lines: OrderEmailLine[]) {
  const items = lines
    .map(
      (line) => `
        <tr><td style="font-size:14px;line-height:1.7;color:#3d3d3d;padding-bottom:4px;">
          ${escape(line.name)} × ${line.quantity} —
          ${formatPrice(line.unitPrice * line.quantity, "TRY")}
        </td></tr>`
    )
    .join("");

  return `<tr><td style="padding-bottom:24px;"><table role="presentation" width="100%">${items}</table></td></tr>`;
}

export function buyerOrderEmail(order: OrderForEmail): Email {
  return {
    subject: `Siparişinizi aldık — ${order.code}`,
    html: WRAP(`
      <tr><td style="font-size:16px;line-height:1.6;color:#1a1a1a;padding-bottom:12px;">Merhaba ${escape(order.fullName)},</td></tr>
      <tr><td style="font-size:16px;line-height:1.7;color:#3d3d3d;padding-bottom:24px;">
        Siparişinizi aldık. Sipariş kodunuz <strong>${order.code}</strong>.
      </td></tr>
      ${lineList(order.lines)}
      <tr><td style="font-size:16px;line-height:1.7;color:#1a1a1a;padding-bottom:24px;">
        Toplam: <strong>${formatPrice(order.total, "TRY")}</strong> — kargo ücretsizdir.
      </td></tr>
      <tr><td style="font-size:16px;line-height:1.7;color:#3d3d3d;padding-bottom:8px;">
        Ödeme, havale ya da EFT ile yapılır. Açıklama kısmına sipariş kodunuzu yazmanız yeterlidir.
      </td></tr>
      ${row("Alıcı", BANK.accountHolder)}
      ${row("Banka", BANK.name)}
      ${row("IBAN", BANK.iban)}
      <tr><td style="font-size:14px;line-height:1.7;color:#6b6b6b;padding:20px 0 32px;">
        Ödemeniz hesabımıza geçtiğinde siparişiniz hazırlanmaya başlar. Sipariş
        detaylarınıza <a href="${SITE.url}/orders/${order.code}" style="color:#1a1a1a;">buradan</a> ulaşabilirsiniz.
      </td></tr>`),
  };
}

export function shopOrderEmail(order: OrderForEmail): Email {
  return {
    // The code in the subject keeps a reply thread attached to one order.
    subject: `Yeni sipariş — ${order.code} — ${formatPrice(order.total, "TRY")}`,
    html: WRAP(`
      <tr><td style="font-size:16px;line-height:1.7;color:#1a1a1a;padding-bottom:24px;">
        <strong>${order.code}</strong> numaralı yeni bir sipariş var.
      </td></tr>
      ${lineList(order.lines)}
      <tr><td style="font-size:16px;line-height:1.7;color:#1a1a1a;padding-bottom:24px;">
        Toplam: <strong>${formatPrice(order.total, "TRY")}</strong>
      </td></tr>
      ${row("Ad soyad", escape(order.fullName))}
      ${row("Telefon", escape(order.phone))}
      ${row("Adres", escape(order.address))}
      ${row("İlçe / İl", `${escape(order.district)} / ${escape(order.city)}`)}
      <tr><td style="font-size:14px;line-height:1.7;color:#6b6b6b;padding:20px 0 32px;">
        Ödeme bekleniyor. Havale geldiğinde siparişin durumunu güncellemeyi unutmayın.
      </td></tr>`),
  };
}

// The two emails an order sends as it moves along.
//
// Neither repeats the bank details: by the time these go out the money has
// arrived, and an IBAN in front of somebody is how an order gets paid twice.
// Both take only what they say — no address, no phone — so there is less of a
// customer's data sitting in an inbox than there needs to be.

export type OrderStatusEmail = {
  code: string;
  total: number;
  fullName: string;
  lines: OrderEmailLine[];
};

export type Shipment = { carrier: string; trackingNumber: string };

export function orderPaidEmail(order: OrderStatusEmail): Email {
  return {
    subject: `Ödemenizi aldık — ${order.code}`,
    html: WRAP(`
      <tr><td style="font-size:16px;line-height:1.6;color:#1a1a1a;padding-bottom:12px;">Merhaba ${escape(order.fullName)},</td></tr>
      <tr><td style="font-size:16px;line-height:1.7;color:#3d3d3d;padding-bottom:24px;">
        <strong>${order.code}</strong> numaralı siparişinizin ödemesi hesabımıza
        geçti. Siparişiniz hazırlanmaya başladı.
      </td></tr>
      ${lineList(order.lines)}
      <tr><td style="font-size:16px;line-height:1.7;color:#1a1a1a;padding-bottom:24px;">
        Toplam: <strong>${formatPrice(order.total, "TRY")}</strong>
      </td></tr>
      <tr><td style="font-size:14px;line-height:1.7;color:#6b6b6b;padding:0 0 32px;">
        Kargoya verildiğinde takip numarasıyla birlikte size tekrar yazacağız.
        Siparişinizi <a href="${SITE.url}/orders/${order.code}" style="color:#1a1a1a;">buradan</a> takip edebilirsiniz.
      </td></tr>`),
  };
}

export function orderShippedEmail(
  order: OrderStatusEmail,
  shipment: Shipment
): Email {
  return {
    subject: `Siparişiniz kargoda — ${order.code}`,
    html: WRAP(`
      <tr><td style="font-size:16px;line-height:1.6;color:#1a1a1a;padding-bottom:12px;">Merhaba ${escape(order.fullName)},</td></tr>
      <tr><td style="font-size:16px;line-height:1.7;color:#3d3d3d;padding-bottom:24px;">
        <strong>${order.code}</strong> numaralı siparişiniz kargoya verildi.
      </td></tr>
      ${row("Kargo firması", escape(shipment.carrier))}
      ${row("Takip numarası", escape(shipment.trackingNumber))}
      <tr><td style="padding-bottom:24px;"></td></tr>
      ${lineList(order.lines)}
      <tr><td style="font-size:14px;line-height:1.7;color:#6b6b6b;padding:0 0 32px;">
        Takip numarası kargo firmasının sisteminde birkaç saat içinde görünür
        hale gelir. Siparişinizi <a href="${SITE.url}/orders/${order.code}" style="color:#1a1a1a;">buradan</a> görebilirsiniz.
      </td></tr>`),
  };
}
