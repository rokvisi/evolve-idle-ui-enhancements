import { userscript } from './build-helpers/build-userscript.mjs';
import { sveltePlugin } from './svelte-plugin';

await Bun.build({
    entrypoints: ['./src/main.ts'],
    outdir: './out',
    naming: '[dir]/evolve-ui-enhancements.user.[ext]',
    banner: userscript,
    format: 'esm',
    target: 'browser',
    packages: 'bundle',
    plugins: [sveltePlugin],
});
