import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Use require for CommonJS
const jwksRsa = require('jwks-rsa');

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(private configService: ConfigService) {
    const keycloakConfig = configService.get('keycloak');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: keycloakConfig.clientId,
      issuer: `${keycloakConfig['auth-server-url']}/realms/${keycloakConfig.realm}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakConfig['auth-server-url']}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`,
      }),
    });
  }

  async validate(payload: any) {
    const keycloakConfig = this.configService.get('keycloak');

    // Extract user information from Keycloak token
    const user = {
      id: payload.sub,
      username: payload.preferred_username || payload.email,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles: this.extractRoles(payload),
      realm: payload.iss.split('/realms/')[1],
      clientId: payload.azp || payload.aud,
    };

    return user;
  }

  private extractRoles(payload: any): string[] {
    const roles: string[] = [];

    // Extract realm roles
    if (payload.realm_access?.roles) {
      roles.push(...payload.realm_access.roles);
    }

    // Extract client roles
    const keycloakConfig = this.configService.get('keycloak');
    if (payload.resource_access?.[keycloakConfig.clientId]?.roles) {
      roles.push(...payload.resource_access[keycloakConfig.clientId].roles);
    }

    return [...new Set(roles)];
  }
}
