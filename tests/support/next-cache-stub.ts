// Stand-in for `next/cache` outside a Next render — see vitest.config.mts.
//
// The `"use cache"` directives in lib/products.ts are inert here: without the
// Next compiler they are just unused string literals, so the functions run as
// plain uncached async functions. Only these two calls would throw, and only
// because they look for a render context that a test process does not have.

export function cacheLife(_profile: string): void {}

export function cacheTag(..._tags: string[]): void {}
