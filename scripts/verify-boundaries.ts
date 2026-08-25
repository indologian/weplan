import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const sourceExtensions = new Set([".ts", ".tsx"]);

export function findClientServerBoundaryViolations(source: string, fileName: string): string[] {
  const isClient = /^\s*["']use client["'];?/m.test(source);
  if (!isClient) return [];

  const serverImport = /(?:from\s+|import\s*\()["']([^"']*(?:\/server(?:\/|$)|env\/server|service-client|server-client)[^"']*)["']/g;
  return [...source.matchAll(serverImport)].map(
    (match) => `${fileName}: client module imports server-only path ${match[1]}`,
  );
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const violations = walk("src")
    .filter((file) => sourceExtensions.has(extname(file)))
    .flatMap((file) => findClientServerBoundaryViolations(readFileSync(file, "utf8"), relative(".", file)));

  if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exit(1);
  }
}
