
import fs from "fs";

let repo = fs.readFileSync("src/modules/invitation/server/repository.ts", "utf-8");
repo = repo.replace("\"Database error during theme validation\", \"SYSTEM_ERROR\"", "\"Database error during theme validation\", \"TEMPORARY_ERROR\"");
fs.writeFileSync("src/modules/invitation/server/repository.ts", repo);

let uploader = fs.readFileSync("src/modules/storage/components/media-uploader.tsx", "utf-8");
if (!uploader.includes("import type { MediaPurpose }")) {
  uploader = uploader.replace("import { useMediaUpload } from \"../hooks\";", "import { useMediaUpload } from \"../hooks\";\nimport type { MediaPurpose } from \"../types\";");
}
fs.writeFileSync("src/modules/storage/components/media-uploader.tsx", uploader);

