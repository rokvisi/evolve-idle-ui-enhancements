<script lang="ts">
    import Modal from '$svelte/primitives/Modal.svelte';
    import Button from '$svelte/primitives/Button.svelte';
    import ControlledInput from '$svelte/compounds/ControlledInput.svelte';
    import Settings from '@lucide/svelte/icons/settings';
    import Switch from '$svelte/primitives/Switch.svelte';
    import Label from '$svelte/primitives/Label.svelte';
    import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
    import * as Alert from '$svelte/primitives/alert/index';
    import { userscript_settings } from '$src/managers/UserscriptSettings';

    let modal_el: Modal;

    const current_settings = $state(userscript_settings.get_all());
    const input_settings = $state(userscript_settings.get_all());
    const changes_made = $derived.by(() => {
        for (const key in input_settings) {
            const typed_key = key as keyof typeof current_settings;

            if (input_settings[typed_key] !== current_settings[typed_key]) {
                return true;
            }
        }

        return false;
    });

    function save_settings() {
        userscript_settings.set_multiple(input_settings);
        Object.assign(current_settings, input_settings);
    }
    function revert_changes() {
        Object.assign(input_settings, current_settings);
    }

    function on_open() {
        modal_el?.open_modal();
    }
    function on_cancel() {
        modal_el?.close_modal();
    }
    function on_save() {
        save_settings();
        modal_el?.close_modal();
    }
</script>

<Button
    onclick={on_open}
    class="h-[40px] rounded border-[rgb(219,219,219)]! text-base font-normal hover:text-[#9573c5]"
    variant="outline"
>
    <Settings /> UserScript Settings
</Button>

<Modal bind:this={modal_el}>
    <div class="dark flex min-w-xl flex-col gap-5">
        <h3 class="text-lg font-semibold">UserScript Settings</h3>

        <div class="flex flex-col gap-2">
            <ControlledInput
                title="Gist ID"
                bind:value={input_settings.cloudsave_gist_id}
            />
            <ControlledInput
                title="Gist Token"
                type="password"
                autocomplete="off"
                bind:value={input_settings.cloudsave_gist_token}
            />
            <ControlledInput
                title="Filename"
                bind:value={input_settings.cloudsave_filename}
            />

            <div class="mt-2 flex items-center space-x-2">
                <Switch
                    id="beep_on_message"
                    bind:checked={input_settings.beep_on_new_message}
                />
                <Label for="beep_on_message">Beep on New Message</Label>
            </div>
        </div>

        <div class="flex items-center justify-end gap-2">
            <!-- TODO: Fix the look of this alert -->
            {#if changes_made}
                <Alert.Root
                    variant="warning"
                    class="flex h-[36px] items-center gap-3 py-1"
                >
                    <AlertCircleIcon />
                    <span>You have unsaved changes.</span>
                    <Button
                        variant="ghost"
                        onclick={revert_changes}
                        size="sm"
                        class="h-6"
                    >
                        Revert Changes
                    </Button>
                </Alert.Root>
            {/if}
            <Button
                onclick={on_cancel}
                variant="outline"
            >
                Cancel
            </Button>
            <Button onclick={on_save}>Save</Button>
        </div>
    </div>
</Modal>
