#!/usr/bin/env node
// Converts a plan export from the old app's format (snake_case keys) to
// next-ref's import format (camelCase keys). Same JSON shape otherwise -
// both use the "workout-plan-export" envelope with phases referenced by
// name and logs referenced by (dayWeekday, exerciseIndex, setIndex, date).
//
// Usage: node scripts/convert-legacy-plan.mjs <input.json> [output.json]

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function snakeToCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function convertKeys(value) {
  if (Array.isArray(value)) return value.map(convertKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [snakeToCamel(k), convertKeys(v)])
    );
  }
  return value;
}

const [, , inputArg, outputArg] = process.argv;
if (!inputArg) {
  console.error('Usage: node scripts/convert-legacy-plan.mjs <input.json> [output.json]');
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const raw = JSON.parse(readFileSync(inputPath, 'utf-8'));

if (raw.format !== 'workout-plan-export') {
  console.error(`Unexpected format: ${raw.format ?? '(missing)'} - expected "workout-plan-export"`);
  process.exit(1);
}

const converted = convertKeys(raw);

const outputPath = outputArg
  ? path.resolve(outputArg)
  : path.join(path.dirname(inputPath), path.basename(inputPath, '.json') + '.converted.json');

writeFileSync(outputPath, JSON.stringify(converted, null, 2) + '\n');
console.log(`Converted ${inputPath} -> ${outputPath}`);
