import { userscript } from "./build-helpers/build-userscript.mjs";

export default {
    input: "src/main.js",
    output: {
        file: "./out/evolve-ui-enhancements.user.js",
        format: "cjs",
        banner: userscript,
    },
};
