import type { HTMLButtonAttributes } from 'svelte/elements';

export type WithElementRef<T> = T & { ref?: HTMLElement | null };
export type HTMLButtonAttributesWithRef = WithElementRef<HTMLButtonAttributes>;
