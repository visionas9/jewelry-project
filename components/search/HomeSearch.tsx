"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SearchField } from "./SearchField";

// The home page doesn't show results — there's one results page and this sends
// you to it. Submitting on Enter rather than searching as you type, because
// every keystroke here would be a page navigation.
export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const term = query.trim();
    const href = term
      ? `/products?query=${encodeURIComponent(term)}`
      : "/products";

    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full max-w-sm">
      <SearchField
        id="home-search"
        label="Bileklik ara"
        placeholder="Taş adı ya da model ara…"
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        isPending={isPending}
        submitLabel="Ara"
      />
    </form>
  );
}
