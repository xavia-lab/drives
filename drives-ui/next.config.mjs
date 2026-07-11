import { fileURLToPath } from "url";
import path from "path";
// Import the version using ESM import attributes
import packageJson from "./package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@refinedev/antd"],
  output: "standalone",
  // Expose the version to the client via public environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
};

export default nextConfig;
