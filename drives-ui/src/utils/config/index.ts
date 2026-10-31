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
  DRIVES_FRONTEND_SESSION_MAX_AGE_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .default(30),
  DRIVES_FRONTEND_KEYCLOAK_SCOPES: z
    .string()
    .default("openid profile email"),
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
  const config = getServerConfig();
  return {
    DRIVES_FRONTEND_CERBOS_URL: config.DRIVES_FRONTEND_CERBOS_URL,
    DRIVES_FRONTEND_API_URL: config.DRIVES_FRONTEND_API_URL,
    DRIVES_FRONTEND_KEYCLOAK_CLIENT_ID:
      config.DRIVES_FRONTEND_KEYCLOAK_CLIENT_ID,
    DRIVES_FRONTEND_KEYCLOAK_ISSUER: config.DRIVES_FRONTEND_KEYCLOAK_ISSUER,
    NEXTAUTH_URL: config.NEXTAUTH_URL,
  };
};
