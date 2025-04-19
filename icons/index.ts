import { readdir } from "node:fs/promises";
import { $ } from "bun";

const files = await readdir(import.meta.dir);

for (const file of files) {
    const [filename, ext] = file.split(".");
    const [res_name, _] = filename.split("-");

    if (ext !== "jpg" && ext !== "png") continue;

    await $`cwebp ${file} -q 80 -o ${res_name}.webp`;
}
