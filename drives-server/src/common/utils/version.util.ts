import { readFileSync } from 'fs';
import { join } from 'path';

// Cast the parsed JSON into a structural object with an optional version string
const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
) as { version?: string };

export const SERVER_VERSION = packageJson.version || '0.0.0';
