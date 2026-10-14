import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import {
  KeycloakConfig,
  KeycloakJwtPayload,
} from '../interfaces/main.interfaces'; // 👈 Fixed: Use clean type-safe ES module imports

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(private readonly configService: ConfigService) {
    // Fixed: Passed explicit interface generic parameter context
    const keycloakConfig = configService.getOrThrow<KeycloakConfig>('keycloak');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: keycloakConfig.clientId,
      issuer: `${keycloakConfig['auth-server-url']}/realms/${keycloakConfig.realm}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakConfig['auth-server-url']}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`,
      }),
    });
  }

  // Fixed: Removed 'async' since there are no active 'await' operations inside
  validate(payload: KeycloakJwtPayload) {
    const keycloakConfig =
      this.configService.getOrThrow<KeycloakConfig>('keycloak');
    const issuerUrl = payload.iss || '';

    // Extract user information securely from Keycloak token
    return {
      id: payload.sub,
      username: payload.preferred_username || payload.email,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles: this.extractRoles(payload, keycloakConfig.clientId),
      realm: issuerUrl.split('/realms/')[1] || 'unknown',
      clientId:
        payload.azp ||
        (Array.isArray(payload.aud) ? payload.aud[0] : payload.aud) ||
        '',
    };
  }

  // Fixed: Fed explicit configuration types into parameters instead of re-getting inside method
  private extractRoles(
    payload: KeycloakJwtPayload,
    clientId: string,
  ): string[] {
    const roles: string[] = [];

    // Extract realm roles safely
    if (payload.realm_access?.roles) {
      roles.push(...payload.realm_access.roles);
    }

    // Extract client roles safely using structured index accessors
    if (payload.resource_access?.[clientId]?.roles) {
      const clientRoles = payload.resource_access[clientId].roles;
      if (clientRoles) {
        roles.push(...clientRoles);
      }
    }

    return [...new Set(roles)];
  }
}
