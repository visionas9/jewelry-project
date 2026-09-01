import "server-only";

// Sending, kept apart from what is sent.
//
// Resend's HTTP API rather than their SDK: one fetch, one less dependency to
// keep current.

// The address Resend is verified to send from, and the one the shop reads.
export const SHOP_EMAIL = "merhaba@ishindenshinstore.com";

const FROM = `ishin denshin <${SHOP_EMAIL}>`;

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

    return "sent";
  } catch (error) {
    // A mail that does not go out is not a reason to lose an order.
    console.error("[email] request failed", error);
    return "failed";
  }
}
