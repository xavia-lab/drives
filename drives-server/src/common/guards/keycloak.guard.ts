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

// Define a safe structural interface for the expected Request object context
interface GuardRequest {
  user?: AuthenticatedUser;
  headers: {
    authorization?: string;
  };
}

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
      context.switchToHttp().getRequest<GuardRequest>().user =
        this.getMockUser();
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

    const request = context.switchToHttp().getRequest<GuardRequest>();
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
    request: GuardRequest,
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
          const err = error as Error;
          this.logger.error(`JIT Database sync failed: ${err.message}`);
          // We continue even if DB sync fails, but the user won't have a dbUser property
        }
      }

      request.user = user;
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error('Token validation process failed', err.stack);
      return false;
    }
  }

  private getMockUser(): AuthenticatedUser {
    return {
      // Must be a valid UUID so it can be persisted into UUID-typed columns
      // (e.g. audit_logs.user_id) while auth is disabled locally.
      id: '00000000-0000-0000-0000-000000000000',
      username: 'admin',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['admin'],
      realm: 'master',
      clientId: 'admin-cli',
    };
  }
}
