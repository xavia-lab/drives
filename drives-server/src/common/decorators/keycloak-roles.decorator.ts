import { SetMetadata } from '@nestjs/common';

export const KEYCLOAK_ROLES_KEY = 'keycloak-roles';
export const KeycloakRoles = (...roles: string[]) =>
  SetMetadata(KEYCLOAK_ROLES_KEY, roles);
