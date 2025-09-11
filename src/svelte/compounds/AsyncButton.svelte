<script
    lang="ts"
    module
>
    import type { ButtonProps } from '$svelte/primitives/Button.svelte';
    import Button from '$svelte/primitives/Button.svelte';
</script>

<script lang="ts">
    let {
        ref = $bindable(null),
        disabled,
        children,
        onclick,
        ...restProps
    }: Omit<ButtonProps, 'onclick'> & { onclick: () => Promise<void> } = $props();
    let loading = $state(false);
</script>

<Button
    bind:ref
    disabled={disabled || loading}
    aria-disabled={disabled || loading}
    aria-busy={loading}
    onclick={async () => {
        loading = true;
        try {
            await onclick();
        } catch {}
        loading = false;
    }}
    {...restProps}
>
    {@render children?.()}
</Button>
