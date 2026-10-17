'use strict';

// Shared helpers for the test seeders.
//
// This file lives in a subdirectory on purpose: sequelize-cli's Umzug loader is
// non-recursive, so only the top-level `*.js` files are executed as seeders.
//
// The test seeders resolve their foreign keys by business key (name/code/...)
// instead of hardcoding IDs owned by other seeders. This keeps each table's
// fixture self-contained and makes adding new test seeders easy.

// Build a { businessKey -> id } map from a reference table.
async function idMap(queryInterface, table, keyColumn = 'name') {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT ${keyColumn} AS k, id AS v FROM ${table};`,
  );

  return rows.reduce((acc, row) => {
    acc[row.k] = row.v;
    return acc;
  }, {});
}

// Throw a helpful error when a required reference row is missing.
function required(map, key, table) {
  const id = map[key];

  if (!id) {
    throw new Error(
      `Test seed prerequisite missing: no '${key}' found in '${table}'. ` +
        'Run "pnpm --filter @drives/drives-server seed:run" before "seed:test".',
    );
  }

  return id;
}

module.exports = { idMap, required };
