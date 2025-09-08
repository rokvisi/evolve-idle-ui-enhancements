import { plugin } from 'bun';
import { compile } from 'svelte/compiler';
import { readFileSync } from 'fs';
import type { BunPlugin } from 'bun';

export const sveltePlugin: BunPlugin = {
    name: 'svelte loader',
    setup(builder) {
        console.log('svelte loader setup');

        builder.onLoad({ filter: /\.svelte(\?[^.]+)?$/ }, ({ path }) => {
            console.log('svelte loader compiling');

            try {
                const source = readFileSync(
                    path.substring(0, path.includes('?') ? path.indexOf('?') : path.length),
                    'utf-8'
                );

                const result = compile(source, {
                    filename: path,
                    generate: 'client',
                    dev: false,
                });

                return {
                    contents: result.js.code,
                    loader: 'js',
                };
            } catch (err) {
                console.log('is it here?');
                throw new Error(`Failed to compile Svelte component: ${(err as any).message}`);
            }
        });
    },
    target: 'browser',
};
