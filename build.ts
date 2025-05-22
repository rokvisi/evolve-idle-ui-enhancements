import { userscript } from "./build-helpers/build-userscript.mjs";

await Bun.build({
    entrypoints: ["./src/main.ts"],
    outdir: "./out",
    naming: "[dir]/evolve-ui-enhancements.user.[ext]",
    banner: userscript,
    format: "esm",
    target: "browser",
});
