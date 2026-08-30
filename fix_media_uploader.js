
import fs from "fs";
let content = fs.readFileSync("src/modules/storage/components/media-uploader.tsx", "utf-8");

content = content.replace("purpose: string;", "purpose: MediaPurpose;");
if (!content.includes("MediaPurpose")) {
  content = content.replace(
    "import { useMediaUpload } from \"../hooks\";",
    "import { useMediaUpload } from \"../hooks\";\nimport type { MediaPurpose } from \"../types\";"
  );
}

content = content.replaceAll("state === \"requesting\"", "state === \"reserving\"");
content = content.replaceAll("state === \"complete\"", "state === \"success\"");

fs.writeFileSync("src/modules/storage/components/media-uploader.tsx", content);

