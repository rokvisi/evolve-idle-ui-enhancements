//* Read the icons directory and generate the "@resource" lines for the userscript header.
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const icon_dir = join(fileURLToPath(new URL(".", import.meta.url)), "../icons");
const icon_files = readdirSync(icon_dir).filter((file) =>
    file.endsWith(".webp")
);

const userscript_resources_lines = icon_files.map((file) => {
    const name = file.replace(/-/g, "_").replace(/\.webp$/, "");
    return `// @resource R_${name} ./icons/${file}`;
});

export const userscript_resources = userscript_resources_lines.join("\n");
