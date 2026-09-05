import "server-only";

// Sending, kept apart from what is sent.
//
// Resend's HTTP API rather than their SDK: one fetch, one less dependency to
// keep current.

// The address Resend is verified to send from. Sending from it needs no
// mailbox — only a verified domain — which is why it works today.
const FROM_EMAIL = "merhaba@ishindenshinstore.com";

const FROM = `ishin denshin <${FROM_EMAIL}>`;

// Where order notifications are read. Separate from FROM_EMAIL because that
// address can send but not receive: the domain has no MX record, so mail to it
// bounces. Set ORDER_EMAIL to a real inbox until it has one.
export const ORDER_EMAIL = process.env.ORDER_EMAIL || FROM_EMAIL;

export type SendResult = "sent" | "skipped" | "failed";

// A file riding along with the mail. `content` is base64 rather than a URL:
// Resend will fetch a `path` for us, but the invoice bucket is private, so that
// would mean minting a signed URL and handing a customer's fatura to a third
// party to go and collect. Sending the bytes keeps the file private and removes
// a step that can fail.
//
// Resend's ceiling is 40MB after encoding, and base64 inflates by about a
// third. An e-Arşiv PDF is a hundred kilobytes, so there is nothing to guard
// against here beyond saying why.
export type Attachment = {
  filename: string;
  /** base64, no data: prefix. */
  content: string;
};

export async function sendEmail(mail: {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;

  // No key means local development or an unconfigured preview. Logging what
  // would have been sent keeps branches from mailing real people, and keeps a
  // missing key from failing an order that has already been written.
  if (!key) {
    const carrying = mail.attachments?.length
      ? ` (+${mail.attachments.length} ek)`
      : "";
    console.info(
      `[email] skipped (no RESEND_API_KEY): ${mail.subject} → ${mail.to}${carrying}`
    );
    return "skipped";
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      // attachments is omitted rather than sent empty when there is none.
      body: JSON.stringify({ from: FROM, ...mail }),
    });

    if (!response.ok) {
      console.error(`[email] ${response.status}: ${await response.text()}`);
      return "failed";
    }

    // The recipient is the part that goes wrong quietly — a bounced address
    // looks the same as a delivered one from here.
    console.info(`[email] sent: ${mail.subject} → ${mail.to}`);

    return "sent";
  } catch (error) {
    // A mail that does not go out is not a reason to lose an order.
    console.error("[email] request failed", error);
    return "failed";
  }
}
