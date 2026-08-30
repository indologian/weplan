
import fs from "fs";
let content = fs.readFileSync("src/modules/storage/hooks.ts", "utf-8");

content = content.replace("setState(\"requesting\");", "setState(\"reserving\");");
content = content.replace("setState(\"complete\");", "setState(\"success\");");
content = content.replace("url: string;", "url?: string;");

fs.writeFileSync("src/modules/storage/hooks.ts", content);

