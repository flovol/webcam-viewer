// MapLibre leitet seine Worker-URL aus import.meta.url ab. Unter Turbopack zeigt
// die auf den Chunk-Ordner, wo maplibre-gl-worker.mjs nicht liegt - der Worker
// bekommt dann Next.js' 404-HTML und stirbt am MIME-Type. Ohne Worker gibt es
// kein raster-dem, also kein 3D-Gelände.
// Deshalb spiegeln wir Worker + Shared-Chunk nach public/ und zeigen im Code per
// setWorkerUrl() dorthin.
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "maplibre-gl", "dist");
const to = join(root, "public", "maplibre");

// maplibre-gl-worker.mjs importiert "./maplibre-gl-shared.mjs" - beide müssen
// nebeneinander liegen.
const FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

await mkdir(to, { recursive: true });

for (const file of FILES) {
  await copyFile(join(from, file), join(to, file));
}

console.log(`maplibre worker -> public/maplibre (${FILES.join(", ")})`);
