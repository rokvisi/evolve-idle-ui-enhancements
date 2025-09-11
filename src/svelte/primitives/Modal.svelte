<script lang="ts">
    const { children } = $props();
    let dialog_el: HTMLDialogElement | null = null;

    export function open_modal() {
        dialog_el?.showModal();
    }
    export function close_modal() {
        dialog_el?.close();
    }
    function on_click_outside(event: MouseEvent) {
        const rect = dialog_el!.getBoundingClientRect();
        const isInDialog =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;

        if (!isInDialog) {
            dialog_el!.close();
        }
    }
</script>

<dialog
    bind:this={dialog_el}
    class="dial border-border m-auto rounded-lg border p-6 text-inherit"
    onclick={on_click_outside}
>
    {@render children?.()}
</dialog>

<style>
    .dial {
        background-color: var(--background);
        transition: all 0.2s allow-discrete;
        opacity: 0;
    }
    .dial::backdrop {
        background-color: oklch(0 0 0);
        transition: all 0.2s allow-discrete;
        opacity: 0;
    }

    .dial[open] {
        opacity: 1;

        @starting-style {
            opacity: 0;
        }
    }
    .dial[open]::backdrop {
        opacity: 0.5;

        @starting-style {
            opacity: 0;
        }
    }
</style>
