// Where the money goes.
//
// One place, because it appears on the confirmation page, in the buyer's email,
// and on any unpaid order they come back to. An IBAN is not a secret — it is
// printed on invoices — so it lives in the repo rather than in an environment
// variable, where changing it would mean a deploy nobody can see the diff of.
export const BANK = {
  accountHolder: "TODO: hesap sahibinin adı",
  name: "TODO: banka adı",
  iban: "TR00 0000 0000 0000 0000 0000 00",
} as const;
