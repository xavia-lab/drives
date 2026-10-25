import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const seedersRoot = join(process.cwd(), 'src/database');

const readSeeder = (directory: string) =>
  readdirSync(join(seedersRoot, directory))
    .filter((file) => file.endsWith('.js'))
    .sort();

const insertedTables = (source: string) =>
  [...source.matchAll(/bulkInsert\(\s*['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );

const lookupDependencies = (source: string) =>
  [...source.matchAll(/idMap\(\s*queryInterface,\s*['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );

const sourceFor = (directory: string, file: string) =>
  readFileSync(join(seedersRoot, directory, file), 'utf8');

const assertDag = (
  directory: string,
  availableBefore: Set<string> = new Set(),
) => {
  const problems: string[] = [];
  const available = new Set(availableBefore);

  for (const file of readSeeder(directory)) {
    const source = sourceFor(directory, file);
    for (const dependency of lookupDependencies(source)) {
      if (!available.has(dependency)) {
        problems.push(`${file} depends on "${dependency}" before it exists`);
      }
    }
    for (const table of insertedTables(source)) available.add(table);
  }

  return { problems, tables: available };
};

describe('database seeders DAG', () => {
  const production = assertDag('seeders');

  it('production seeders are ordered by their lookup dependencies', () => {
    expect(production.problems).toEqual([]);
  });

  it('test seeders only depend on production data or earlier test fixtures', () => {
    const test = assertDag('test-seeders', production.tables);
    expect(test.problems).toEqual([]);
  });

  it('runs every production seeder before the test fixtures', () => {
    const productionFiles = readSeeder('seeders');
    const testFiles = readSeeder('test-seeders');
    const latestProduction = productionFiles
      .map((file) => file.slice(0, 14))
      .sort()
      .at(-1);
    const earliestTest = testFiles.map((file) => file.slice(0, 14)).sort()[0];

    expect(latestProduction! < earliestTest).toBe(true);
  });
});
