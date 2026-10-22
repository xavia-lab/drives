#!/bin/sh
set -eu

echo "--- STARTING ENTRYPOINT SCRIPT ---"
echo "Step 1/3: Running migrations..."
node ./node_modules/sequelize-cli/lib/sequelize db:migrate

echo "Step 2/3: Running seeds..."
node ./node_modules/sequelize-cli/lib/sequelize db:seed:all

echo "Step 3/3: Starting NestJS app..."
exec node dist/src/main.js
