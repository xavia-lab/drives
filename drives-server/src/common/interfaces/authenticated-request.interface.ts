import { User } from '../../modules/user/entities/user.entity';

export interface KeycloakTokenPayload {
  sub: string;
  preferred_username?: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
  iss?: string;
  aud?: string;
}

export interface KeycloakTokenInfo {
  id: string;
  username: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  realm?: string;
  clientId?: string;
}

export interface AuthenticatedUser extends KeycloakTokenInfo {
  dbUser?: User;
}
