// Where the money goes.
//
// One place, because it appears on the confirmation page, in the buyer's email,
// and on any unpaid order they come back to. An IBAN is not a secret — it is
// printed on invoices and shown to every buyer — so it lives in the repo rather
// than in an environment variable.
//
// A personal account, not the company's. That is fine for a transfer; a card
// payment provider will need one in the business's name.
export const BANK = {
  accountHolder: "Hilal SIRLI",
  name: "Akbank — Maltepe",
  iban: "TR39 0004 6000 2988 8000 3316 68",
} as const;
