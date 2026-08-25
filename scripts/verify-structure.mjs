import { existsSync } from "node:fs";

const violations = [];
if (existsSync("app") && existsSync("src/app")) violations.push("root app/ and src/app/ cannot coexist");
if (existsSync("src/public")) violations.push("static assets must live in root public/");
if (!existsSync("src/app")) violations.push("canonical src/app/ directory is missing");

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}
