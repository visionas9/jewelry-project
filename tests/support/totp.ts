import { createHmac } from "node:crypto";

// Six digits from a shared secret, the same way an authenticator app does it.
// Hand-rolled rather than a dependency: it is fifteen lines, and the tests are
// the only thing that needs it.

function base32Decode(secret: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";

  for (const char of secret.replace(/=+$/, "").toUpperCase()) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes = bits.match(/.{8}/g) ?? [];

  return Buffer.from(bytes.map((byte) => parseInt(byte, 2)));
}

export function totpCode(secret: string, at: number = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30000)));

  const digest = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value = digest.readUInt32BE(offset) & 0x7fffffff;

  return (value % 1_000_000).toString().padStart(6, "0");
}
