import { existsSync, readdirSync, readFileSync } from "node:fs";

const directory = "supabase/migrations";
if (!existsSync(directory)) {
  console.error(`${directory} is missing`);
  process.exit(1);
}

const migrations = readdirSync(directory).filter((file) => file.endsWith(".sql"));
const invalidNames = migrations.filter((file) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(file));
const emptyFiles = migrations.filter((file) => readFileSync(`${directory}/${file}`, "utf8").trim().length === 0);

if (invalidNames.length || emptyFiles.length) {
  console.error(`Invalid migration names: ${invalidNames.join(", ") || "none"}`);
  console.error(`Empty migrations: ${emptyFiles.join(", ") || "none"}`);
  process.exit(1);
}
