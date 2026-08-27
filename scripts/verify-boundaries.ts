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

type SourceFile = { fileName: string; source: string };

export function findDomainDependencyCycles(files: SourceFile[]): string[] {
  const graph = new Map<string, Set<string>>();
  for (const { fileName, source } of files) {
    const normalized = fileName.replaceAll("\\", "/");
    const sourceDomain = normalized.match(/src\/modules\/([^/]+)\//)?.[1];
    if (!sourceDomain) continue;
    if (!graph.has(sourceDomain)) graph.set(sourceDomain, new Set());
    const moduleImport = /["']@\/modules\/([^/]+)(?:\/|["'])/g;
    for (const match of source.matchAll(moduleImport)) {
      const targetDomain = match[1];
      if (targetDomain && targetDomain !== sourceDomain) graph.get(sourceDomain)?.add(targetDomain);
    }
  }

  const cycles = new Set<string>();
  const visit = (domain: string, path: string[]) => {
    const cycleStart = path.indexOf(domain);
    if (cycleStart >= 0) {
      const cycle = [...path.slice(cycleStart), domain];
      const rotations = cycle.slice(0, -1).map((_, index) => {
        const nodes = cycle.slice(0, -1);
        const rotated = [...nodes.slice(index), ...nodes.slice(0, index)];
        return [...rotated, rotated[0]].join(" -> ");
      });
      cycles.add(rotations.sort()[0]!);
      return;
    }
    for (const target of graph.get(domain) ?? []) visit(target, [...path, domain]);
  };
  for (const domain of graph.keys()) visit(domain, []);
  return [...cycles].sort().map((cycle) => `domain dependency cycle: ${cycle}`);
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const files = walk("src")
    .filter((file) => sourceExtensions.has(extname(file)))
    .map((file) => ({ fileName: relative(".", file), source: readFileSync(file, "utf8") }));
  const violations = [
    ...files.flatMap(({ fileName, source }) => findClientServerBoundaryViolations(source, fileName)),
    ...findDomainDependencyCycles(files),
  ];

  if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exit(1);
  }
}
