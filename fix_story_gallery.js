
import fs from "fs";
let content = fs.readFileSync("src/modules/invitation/components/editor/steps/story-gallery-step.tsx", "utf-8");
content = content.replace("purpose=\"love_story\"", "purpose=\"story_image\"");
fs.writeFileSync("src/modules/invitation/components/editor/steps/story-gallery-step.tsx", content);

