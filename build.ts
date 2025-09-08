import { userscript } from './build-helpers/build-userscript.mjs';
import { SveltePlugin } from 'bun-plugin-svelte';

try {
    await Bun.build({
        entrypoints: ['./src/main.ts'],
        outdir: './out',
        naming: '[dir]/evolve-ui-enhancements.user.[ext]',
        banner: userscript,
        format: 'esm',
        target: 'browser',
        packages: 'bundle',
        plugins: [
            SveltePlugin({
                development: false,
                forceSide: 'client',
                runes: true,
            }),
        ],
        throw: true,
    });
} catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
}
