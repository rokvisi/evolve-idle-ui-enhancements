import { readFileSync } from "node:fs";
import { userscript_resources } from "./userscript-resources.mjs";

const header = readFileSync("./build-helpers/userscript-header.txt", "utf8");
const footer = readFileSync("./build-helpers/userscript-footer.txt", "utf8");

export const userscript = `${header}\n${userscript_resources}\n${footer}`;
