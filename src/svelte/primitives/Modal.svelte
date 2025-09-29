<script lang="ts">
    let { children, ref = $bindable(null) } = $props();

    export function open_modal() {
        ref?.showModal();
    }
    export function close_modal() {
        ref?.close();
    }
    function on_click_outside(event: MouseEvent) {
        const rect = ref!.getBoundingClientRect();
        const isInDialog =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;

        if (!isInDialog) {
            ref!.close();
        }
    }
</script>

<dialog
    bind:this={ref}
    class="dialog border-border relative m-auto rounded-lg border p-6 text-inherit"
    onclick={on_click_outside}
>
    {@render children?.()}
</dialog>

<style>
    .dialog {
        background-color: var(--background);
        transition: all 0.2s allow-discrete;
        opacity: 0;
    }
    .dialog::backdrop {
        background-color: oklch(0 0 0);
        transition: all 0.2s allow-discrete;
        opacity: 0;
    }

    .dialog[open] {
        opacity: 1;

        @starting-style {
            opacity: 0;
        }
    }
    .dialog[open]::backdrop {
        opacity: 0.5;

        @starting-style {
            opacity: 0;
        }
    }
</style>
