/* global process, console */
// Supply chain checks on package-lock.json, run by the Security workflow on every pull request.
//
// 1. Every package must be downloaded from the public npm registry. A lockfile entry pointing at
//    another host or a git URL is a common way to slip in a tampered package.
// 2. A pull request must not add a package that runs an install script. Install scripts run on
//    every machine that installs the project, which makes them the usual home for npm malware.
//    If a new one is genuinely needed, the project lead reviews it and merges the PR.
//
// Usage: node .github/scripts/check-lockfile.mjs <base commit sha>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REGISTRY = 'https://registry.npmjs.org/';
const base = process.argv[2];

function packages(json) {
  return JSON.parse(json).packages ?? {};
}

function name(path) {
  return path.replace(/^.*node_modules\//, '');
}

const head = packages(readFileSync('package-lock.json', 'utf8'));
let failed = false;

for (const [path, pkg] of Object.entries(head)) {
  if (pkg.link || !pkg.resolved) continue;
  if (!pkg.resolved.startsWith(REGISTRY)) {
    console.log(
      `::error file=package-lock.json::${name(path)} is downloaded from ${pkg.resolved}, not the npm registry`,
    );
    failed = true;
  }
}

let before = null;
if (base) {
  try {
    const old = execFileSync('git', ['show', `${base}:package-lock.json`], {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    });
    before = packages(old);
  } catch {
    console.log(
      'The base branch has no package-lock.json, so the install script check is skipped.',
    );
  }
}

if (before) {
  const added = Object.entries(head)
    .filter(([path, pkg]) => pkg.hasInstallScript && !before[path]?.hasInstallScript)
    .map(([path, pkg]) => `${name(path)}@${pkg.version}`);
  for (const pkg of added) {
    console.log(
      `::error file=package-lock.json::${pkg} runs an install script and is new in this pull request. The project lead must review it.`,
    );
  }
  if (added.length) failed = true;
}

if (failed) process.exit(1);
console.log('Lockfile checks passed.');
