import { z } from "zod";

const envSchema = z.object({
  DRIVES_FRONTEND_CERBOS_URL: z.string().url(),
  DRIVES_FRONTEND_API_URL: z.string().url(),
  DRIVES_FRONTEND_KEYCLOAK_CLIENT_ID: z.string(),
  DRIVES_FRONTEND_KEYCLOAK_ISSUER: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  // Keep secrets private (do not send these to the client)
  DRIVES_FRONTEND_KEYCLOAK_CLIENT_SECRET: z.string(),
  NEXTAUTH_SECRET: z.string(),
});

export const getServerConfig = () => {
  const env = envSchema.parse(process.env);

  // Log them once on server start (Docker logs)
  console.log("🚀 Configuration Loaded:", {
    ...env,
    DRIVES_FRONTEND_KEYCLOAK_CLIENT_SECRET: "***",
    NEXTAUTH_SECRET: "***",
  });

  return env;
};

// Extract only public-facing variables for the client
export const getPublicConfig = () => {
  const {
    DRIVES_FRONTEND_KEYCLOAK_CLIENT_SECRET,
    NEXTAUTH_SECRET,
    ...publicEnv
  } = getServerConfig();
  return publicEnv;
};
