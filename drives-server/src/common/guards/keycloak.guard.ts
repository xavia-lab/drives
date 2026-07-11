import {
  Injectable,
  ExecutionContext,
  Inject,
  Optional,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { KeycloakValidationService } from '../../modules/keycloak/keycloak-validation.service';
import { UserService } from '../../modules/user/user.service';
import { AuthenticatedUser } from '../interfaces/authenticated-request.interface';

@Injectable()
export class KeycloakAuthGuard extends AuthGuard('keycloak') {
  private readonly logger = new Logger(KeycloakAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private keycloakValidationService: KeycloakValidationService,
    @Optional() @Inject(UserService) private userService?: UserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authEnabled = this.configService.get<boolean>(
      'app.authEnabled',
      true,
    );

    if (!authEnabled) {
      this.logger.warn('Authentication is disabled. Attaching mock user.');
      context.switchToHttp().getRequest().user = this.getMockUser();
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log(
        `Authentication Guard is not applied as the request is marked Public`,
      );
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const success = await this.validateTokenAndUpsertUser(token, request);
      if (!success)
        throw new UnauthorizedException('Invalid token or user sync failed');
      return true;
    }

    // Fallback to the passport strategy if no Bearer token is found manually
    return super.canActivate(context) as Promise<boolean>;
  }

  private async validateTokenAndUpsertUser(
    token: string,
    request: any,
  ): Promise<boolean> {
    try {
      const keycloakUser =
        await this.keycloakValidationService.getUserInfo(token);

      if (!keycloakUser?.id || !keycloakUser?.email) {
        return false;
      }

      const user: AuthenticatedUser = { ...keycloakUser };

      // Sync with Database if UserService is available
      if (this.userService) {
        try {
          user.dbUser = await this.userService.upsertUserFromKeycloak({
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            realm: user.realm,
            clientId: user.clientId,
            lastLogin: new Date(),
            isActive: true, // Ensuring status is set
          });
        } catch (error) {
          this.logger.error(`JIT Database sync failed: ${error.message}`);
          // We continue even if DB sync fails, but the user won't have a dbUser property
        }
      }

      request.user = user;
      return true;
    } catch (error) {
      this.logger.error('Token validation process failed', error.stack);
      return false;
    }
  }

  private getMockUser(): AuthenticatedUser {
    return {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['admin'],
      realm: 'master',
      clientId: 'admin-cli',
    };
  }
}
