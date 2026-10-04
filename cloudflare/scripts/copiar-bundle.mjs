// Deja en dist/ solo el Worker empaquetado (sin sourcemap ni README) y borra la carpeta temporal.
import { cpSync, mkdirSync, rmSync } from "node:fs";
mkdirSync("dist", { recursive: true });
cpSync("dist-tmp/worker.js", "dist/worker.js");
rmSync("dist-tmp", { recursive: true, force: true });
console.log("dist/worker.js actualizado");
