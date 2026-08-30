
import fs from "fs";
let content = fs.readFileSync("C:/Users/admin/.gemini/antigravity/brain/e7d16185-9f1e-4058-bbcf-c4389a33313a/task.md", "utf-8");
content = content.replace("[ ] Media Contract API Validation", "[x] Media Contract API Validation");
content = content.replace("[ ] Checkout Reuse Publish-Readiness Gate", "[x] Checkout Reuse Publish-Readiness Gate");
content = content.replace("[ ] Theme Override Active Validation", "[x] Theme Override Active Validation");
content = content.replace("[ ] Create Flow ClientRef Persistence", "[x] Create Flow ClientRef Persistence");
content = content.replace("[ ] Testing & CI Verification", "[x] Testing & CI Verification");
fs.writeFileSync("C:/Users/admin/.gemini/antigravity/brain/e7d16185-9f1e-4058-bbcf-c4389a33313a/task.md", content);

