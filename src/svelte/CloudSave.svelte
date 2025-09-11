<script
    lang="ts"
    module
>
    import { safeFetch, safeFetchJsonSchema } from '$src/utils/safeFetch';
    import { toast } from 'svelte-sonner';
    import HardDriveUpload from '@lucide/svelte/icons/hard-drive-upload';
    import HardDriveDownload from '@lucide/svelte/icons/hard-drive-download';
    import { safeTryWithToast } from '$src/utils/safeTry';
    import AsyncButton from '$svelte/compounds/AsyncButton.svelte';
    import { userscript_settings } from '$src/managers/UserscriptSettings';
    import * as v from 'valibot';

    export const GistResponseSchema = v.object({
        files: v.record(
            v.string(),
            v.object({
                content: v.string(),
                encoding: v.string(),
                filename: v.string(),
                language: v.string(),
                raw_url: v.pipe(v.string(), v.url()),
                size: v.number(),
                truncated: v.boolean(),
                type: v.string(),
            })
        ),
    });
</script>

<script lang="ts">
    async function loadFromGist() {
        const { result, error } = await safeTryWithToast(
            () =>
                safeFetchJsonSchema(
                    `https://api.github.com/gists/${userscript_settings.get('cloudsave_gist_id')}`,
                    {
                        method: 'GET',
                        headers: { Authorization: `token ${userscript_settings.get('cloudsave_gist_token')}` },
                        signal: AbortSignal.timeout(5000),
                    },
                    GistResponseSchema
                ),
            {
                loading: 'Loading cloud save...',
                success: 'Successfully loaded cloud save.',
                error: (e) => `Failed to load cloud save. Cause: ${(e as Error).cause}`,
            }
        );
        if (error) return;

        // Check if the gist contains the expected file.
        if (!result.files['save.txt']) {
            toast.error('Gist does not contain "save.txt".');
            return;
        }

        // Get the save data from the file.
        const content = result.files['save.txt'].content;

        // Insert the file content into the textarea.
        const textarea = document.querySelector('textarea#importExport') as HTMLTextAreaElement | undefined;
        if (!textarea) {
            toast.error('Could not insert cloud save into textarea.');
            return;
        }

        textarea.value = content;
    }
    async function saveToGist() {
        // Get the save data from the game.
        const saveData = (unsafeWindow as any).exportGame();
        if (!saveData) {
            toast.error('Could not export game data.');
            return;
        }

        // TODO: Fetch first to check if the file exists, then update or create accordingly.
        const save_file_exists = true;
        const method = save_file_exists ? 'PATCH' : 'POST';

        await safeTryWithToast(
            () =>
                safeFetch(`https://api.github.com/gists/${userscript_settings.get('cloudsave_gist_id')}`, {
                    method,
                    headers: { Authorization: `token ${userscript_settings.get('cloudsave_gist_token')}` },
                    body: `{ "files": { "${userscript_settings.get('cloudsave_filename')}": { "content": "${saveData}" } } }`,
                }),
            {
                loading: 'Saving to cloud...',
                success: 'Successfully saved to cloud.',
                error: (e) => `Failed to save to cloud. Cause: ${(e as Error).cause}`,
            }
        );
    }
</script>

<AsyncButton
    onclick={loadFromGist}
    variant="outline"
    class="h-[40px] rounded border-[rgb(219,219,219)]! text-base font-normal hover:text-[#9573c5] disabled:hover:text-current"
>
    <HardDriveDownload /> Load from Cloud
</AsyncButton>

<AsyncButton
    onclick={saveToGist}
    variant="outline"
    class="h-[40px] rounded border-[rgb(219,219,219)]! text-base font-normal hover:text-[#9573c5] disabled:hover:text-current"
>
    <HardDriveUpload /> Save To Cloud
</AsyncButton>
