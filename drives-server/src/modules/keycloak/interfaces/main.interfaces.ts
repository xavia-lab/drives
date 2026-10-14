import * as jwt from 'jsonwebtoken';

// 1. Declare explicit signature layout for Keycloak environment settings
export interface KeycloakConfig {
  clientId: string;
  'auth-server-url': string;
  realm: string;
}

// 2. Declare structural type context for incoming token payloads
export interface KeycloakJwtPayload {
  sub: string;
  preferred_username?: string;
  email: string;
  given_name?: string;
  family_name?: string;
  iss: string;
  azp?: string;
  aud?: string | string[];
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
}

// Define the structural layout interface for jsonwebtoken complete decodes
export interface DecodedCompleteToken {
  header: {
    alg: string;
    typ: string;
    kid?: string;
  };
  payload: string | jwt.JwtPayload;
  signature: string;
}
