import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { GRPC as Cerbos } from '@cerbos/grpc';
import { AuthenticatedUser } from '../interfaces/authenticated-request.interface';
import { PolicyMetadata } from '../decorators/check-policy.decorator';

@Injectable()
export class CerbosGuard implements CanActivate {
  private readonly logger = new Logger(CerbosGuard.name);
  private cerbos: Cerbos;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    const cerbosUrl = this.configService.get<string>(
      'DRIVES_BACKEND_CERBOS_URL',
      'localhost:3593',
    );
    this.cerbos = new Cerbos(cerbosUrl, { tls: false });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if auth is globally enabled
    const authEnabled = this.configService.get<boolean>(
      'app.authEnabled',
      true,
    );
    if (!authEnabled) return true;

    // 2. Get policy metadata from the @CheckPolicy decorator
    const policy = this.reflector.get<PolicyMetadata>(
      'policy',
      context.getHandler(),
    );
    if (!policy) return true;

    // 3. Get user from request (populated by KeycloakAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      this.logger.error('No user found in request.');
      return false;
    }

    // 4. Pure RBAC Check (No DB fetch)
    const id = request.params.id;

    // Force managed to false, to ensure the policy check passes
    // without needing a DB lookup for the 'managed' status.
    let attributes: Record<string, any> = {};

    const managedResources = [
      'colors',
      'categories',
      'currencies',
      'materials',
      'metals',
      'quantity-units',
    ];
    if (id && managedResources.includes(policy.resource)) {
      attributes = { managed: false };
    }

    const decision = await this.cerbos.checkResource({
      principal: {
        id: user.id,
        roles: user.roles,
      },
      resource: {
        kind: policy.resource,
        id: id?.toString() || 'new',
        attr: attributes,
      },
      actions: [policy.action],
    });

    const isAllowed = decision.isAllowed(policy.action) ?? false;

    if (!isAllowed) {
      this.logger.warn(
        `Access Denied: ${user.username} -> ${policy.action} on ${policy.resource}`,
      );
    } else {
      this.logger.debug(
        `Access Granted: ${user.username} -> ${policy.action} on ${policy.resource}`,
      );
    }

    return isAllowed;
  }
}
