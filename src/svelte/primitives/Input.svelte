<script
    lang="ts"
    module
>
    import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
    import { cn } from '$svelte/utils';
    import type { WithElementRef } from '$svelte/types';
    export type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;
    export type InputProps = WithElementRef<
        Omit<HTMLInputAttributes, 'type'> & { type?: InputType; files?: undefined }
    >;
</script>

<script lang="ts">
    let {
        ref = $bindable(null),
        value = $bindable(),
        checked = $bindable(),
        type,
        class: className,
        ...restProps
    }: InputProps = $props();
</script>

<input
    bind:this={ref}
    data-slot="input"
    class={cn(
        'border-input bg-background ring-offset-background selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground dark:bg-input/30 flex h-9 w-full min-w-0  rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className
    )}
    {type}
    bind:value
    {...restProps}
/>
