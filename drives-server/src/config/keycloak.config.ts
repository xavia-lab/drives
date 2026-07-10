import { registerAs } from '@nestjs/config';

export interface KeycloakConfig {
  realm: string;
  'auth-server-url': string;
  'ssl-required': string;
  'bearer-only': boolean;
  resource: string;
  'public-client': boolean;
  'use-resource-role-mappings': boolean;
  'confidential-port': number;
}

export default registerAs('keycloak', () => ({
  realm: process.env.DRIVES_BACKEND_KEYCLOAK_REALM,
  'auth-server-url': process.env.DRIVES_BACKEND_KEYCLOAK_URL,
  'ssl-required':
    process.env.DRIVES_BACKEND_KEYCLOAK_SSL_REQUIRED || 'external',
  resource: process.env.DRIVES_BACKEND_KEYCLOAK_CLIENT_ID,
  'public-client':
    process.env.DRIVES_BACKEND_KEYCLOAK_PUBLIC_CLIENT !== 'false',
  'use-resource-role-mappings':
    process.env.DRIVES_BACKEND_KEYCLOAK_RESOURCE_ROLE_MAPPINGS !== 'true',
  'confidential-port': parseInt(
    process.env.DRIVES_BACKEND_KEYCLOAK_CONFIDENTIAL_PORT || '0',
    10,
  ),
  credentials: {
    secret: process.env.DRIVES_BACKEND_KEYCLOAK_CLIENT_SECRET,
  },

  // For JWT validation
  clientId: process.env.DRIVES_BACKEND_KEYCLOAK_CLIENT_ID || 'iris-app',
  realmPublicKey: process.env.DRIVES_BACKEND_KEYCLOAK_REALM_PUBLIC_KEY || '',
  bearerOnly: true,
}));
