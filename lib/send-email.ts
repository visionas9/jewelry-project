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

export async function sendEmail(mail: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;

  // No key means local development or an unconfigured preview. Logging what
  // would have been sent keeps branches from mailing real people, and keeps a
  // missing key from failing an order that has already been written.
  if (!key) {
    console.info(`[email] skipped (no RESEND_API_KEY): ${mail.subject} → ${mail.to}`);
    return "skipped";
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
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
