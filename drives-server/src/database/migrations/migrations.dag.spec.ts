import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const migrationsDir = join(process.cwd(), 'src/database/migrations');
const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.js'))
  .sort();

const createdTable = (source: string) =>
  /createTable\(\s*['"]([^'"]+)['"]/.exec(source)?.[1];

const referencedTables = (source: string) =>
  [...source.matchAll(/references:\s*\{\s*model:\s*['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );

describe('database migrations DAG', () => {
  it('creates every referenced table in an earlier migration', () => {
    const createdBy = new Map<string, string>();
    const problems: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(migrationsDir, file), 'utf8');
      const table = createdTable(source);
      for (const dependency of referencedTables(source)) {
        const createdIn = createdBy.get(dependency);
        if (!createdIn) {
          problems.push(`${file} references "${dependency}" before it exists`);
        }
      }
      if (table) createdBy.set(table, file);
    }

    expect(problems).toEqual([]);
  });

  it('uses unique migration timestamps', () => {
    const timestamps = files.map((file) => file.slice(0, 14));
    expect(new Set(timestamps).size).toBe(timestamps.length);
  });
});
