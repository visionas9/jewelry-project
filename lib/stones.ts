import type { Stone } from "@/types/product";

// The display order of the filter pills, with Turkish labels. The `value`s
// match the check constraint on products.stone — the database is the source
// of truth for what's allowed.
export const STONES = [
  { value: "kuvars", label: "Kuvars" },
  { value: "inci", label: "İnci" },
  { value: "lapis", label: "Lapis" },
  { value: "rodonit", label: "Rodonit" },
  { value: "akik", label: "Akik" },
  { value: "turmalin", label: "Turmalin" },
] as const satisfies readonly { value: Stone; label: string }[];

// searchParams is whatever the visitor typed in the URL bar. Never pass it to
// a query without checking it's a stone we actually know.
export function isStone(value: unknown): value is Stone {
  return STONES.some((stone) => stone.value === value);
}

export function stoneLabel(value: Stone): string {
  return STONES.find((stone) => stone.value === value)?.label ?? value;
}
