import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { INVOICE_BUCKET, invoiceFilename } from "./invoices-paths";
import type { Attachment } from "./send-email";

export { INVOICE_BUCKET, invoiceFilename, invoicePath } from "./invoices-paths";

/**
 * The fatura as an email attachment, or null.
 *
 * Null on every failure rather than throwing: this runs after an order has
 * already moved, and a buyer being told their payment arrived matters more than
 * the PDF riding along. She can send the invoice on its own afterwards.
 */
export async function invoiceAttachment(
  supabase: SupabaseClient,
  code: string,
  path: string | null
): Promise<Attachment | null> {
  if (!path) return null;

  try {
    const { data, error } = await supabase.storage
      .from(INVOICE_BUCKET)
      .download(path);

    if (error || !data) return null;

    const bytes = Buffer.from(await data.arrayBuffer());

    return { filename: invoiceFilename(code), content: bytes.toString("base64") };
  } catch {
    return null;
  }
}

/**
 * A link the buyer can use, good for a few minutes.
 *
 * Minted per request rather than stored: a URL that lives in the database is a
 * URL that outlives the reason it was created.
 */
export async function invoiceDownloadUrl(
  supabase: SupabaseClient,
  code: string,
  path: string | null
): Promise<string | null> {
  if (!path) return null;

  const { data } = await supabase.storage
    .from(INVOICE_BUCKET)
    .createSignedUrl(path, 300, { download: invoiceFilename(code) });

  return data?.signedUrl ?? null;
}
