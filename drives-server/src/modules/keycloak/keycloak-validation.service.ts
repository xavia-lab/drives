import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import {
  KeycloakTokenPayload,
  KeycloakTokenInfo,
} from '../../common/interfaces/authenticated-request.interface';
import { DecodedCompleteToken } from './interfaces/main.interfaces';

@Injectable()
export class KeycloakValidationService {
  private readonly logger = new Logger(KeycloakValidationService.name);
  private readonly jwksClient: JwksClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('keycloak.auth-server-url');
    const realm = this.configService.get<string>('keycloak.realm');

    this.jwksClient = new JwksClient({
      jwksUri: `${url}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }

  /** Validates the JWT and returns the typed payload */
  async validateToken(token: string): Promise<KeycloakTokenPayload | null> {
    try {
      // Fixed: Replace 'as any' with an explicit decoded interface layout
      const decoded = jwt.decode(token, {
        complete: true,
      }) as DecodedCompleteToken | null;
      if (!decoded?.header?.kid) throw new Error('Invalid token: missing kid');

      const key = await this.jwksClient.getSigningKey(decoded.header.kid);
      const signingKey = key.getPublicKey();

      const clientId = this.configService.get<string>('keycloak.clientId');
      // Fixed: Added string generics to config lookups to avoid raw any cascades
      const serverUrl = this.configService.get<string>(
        'keycloak.auth-server-url',
      );
      const realmName = this.configService.get<string>('keycloak.realm');
      const issuer = `${serverUrl}/realms/${realmName}`;

      return jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        audience: clientId,
        issuer,
      }) as KeycloakTokenPayload;
    } catch (error) {
      // Fixed: Cast the error parameter to a standard Error block
      const err = error as Error;
      this.logger.error(`Token validation failed: ${err.message}`);
      return null;
    }
  }

  /** Extracts and flattens roles from both realm and client levels */
  private extractRoles(payload: KeycloakTokenPayload): string[] {
    const roles = new Set<string>();
    const clientId = this.configService.get<string>('keycloak.clientId');

    // Realm-level roles
    payload.realm_access?.roles?.forEach((r) => roles.add(r));

    // Client-level roles
    if (clientId && payload.resource_access?.[clientId]?.roles) {
      payload.resource_access[clientId].roles.forEach((r) => roles.add(r));
    }

    return Array.from(roles);
  }

  /** Bridges the raw token to your internal App User format */
  async getUserInfo(token: string): Promise<KeycloakTokenInfo | null> {
    const payload = await this.validateToken(token);
    if (!payload) return null;

    return {
      id: payload.sub,
      username: payload.preferred_username || payload.email,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      name:
        payload.name ||
        `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
      roles: this.extractRoles(payload),
    };
  }
}
