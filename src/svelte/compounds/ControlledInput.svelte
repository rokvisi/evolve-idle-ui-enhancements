<script
    lang="ts"
    module
>
    import Input from '$svelte/primitives/Input.svelte';
    import Button from '$svelte/primitives/Button.svelte';
    import { copyToClipboard } from '$src/utils';
    import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
    import X from '@lucide/svelte/icons/x';
    import type { InputProps } from '$svelte/primitives/Input.svelte';
</script>

<script lang="ts">
    let {
        ref = $bindable(null),
        value = $bindable(''),
        checked = $bindable(),
        type,
        class: className,
        title = 'Title',
        ...restProps
    }: InputProps & { title: string } = $props();

    function clear() {
        value = '';
    }
    async function copy() {
        await copyToClipboard(value);
    }
</script>

<div>
    <span class="mb-2 inline-block text-sm font-medium">{title}</span>
    <div class="flex items-center gap-2">
        <Input
            bind:ref
            {type}
            {checked}
            placeholder={title}
            bind:value
            {...restProps}
            class={className}
        />
        <Button
            variant="outline"
            size="icon"
            class="size-9"
            onclick={copy}
        >
            <ClipboardCopy />
        </Button>
        <Button
            variant="outline"
            size="icon"
            class="size-9"
            onclick={clear}
        >
            <X />
        </Button>
    </div>
</div>
