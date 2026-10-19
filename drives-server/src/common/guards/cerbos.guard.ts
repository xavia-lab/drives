import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { GRPC as Cerbos } from '@cerbos/grpc';
import { Value } from '@cerbos/core';
import { AuthenticatedUser } from '../interfaces/authenticated-request.interface';
import { PolicyMetadata } from '../decorators/check-policy.decorator';
import { ManagedResourcesService } from '../../modules/metadata/managed-resources.service';

@Injectable()
export class CerbosGuard implements CanActivate {
  private readonly logger = new Logger(CerbosGuard.name);
  private cerbos: Cerbos;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private readonly managedResources: ManagedResourcesService,
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

    // 3. Get user from request with explicit type arguments
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params: Record<string, string | undefined>;
    }>();

    const user = request.user;

    if (!user) {
      this.logger.error('No user found in request.');
      return false;
    }

    // 4. Pure RBAC Check (No DB fetch)
    const id = request.params.id;

    // Use unknown record type to safely avoid explicit "any" casting rules
    let attributes: Record<string, Value> = {};

    // The set of managed resources is derived from the models at bootstrap
    // (see ManagedResourcesService) so it can never drift from the entities.
    if (id && this.managedResources.has(policy.resource)) {
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
