import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

/**
 * Single source of truth for the set of REST resources that carry a `managed`
 * attribute (i.e. whose Cerbos policy may gate `edit`/`delete` on
 * `request.resource.attr.managed`).
 *
 * The list is derived at bootstrap from the Sequelize models themselves, so a
 * new managed lookup is picked up automatically — no list to keep in sync in
 * the guard, the UI, and the policies. The resource slug is the kebab-case of
 * the table name (`pool_types` → `pool-types`), matching the REST/Cerbos
 * resource naming convention used across the app.
 */
@Injectable()
export class ManagedResourcesService implements OnModuleInit {
  private slugs = new Set<string>();

  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  onModuleInit(): void {
    this.slugs = new Set(
      Object.values(this.sequelize.models)
        .filter((model) => Boolean(model.getAttributes().managed))
        .map((model) => {
          const tableName = model.getTableName();
          const name =
            typeof tableName === 'string' ? tableName : tableName.tableName;
          return name.replace(/_/g, '-');
        }),
    );
  }

  /** All managed resource slugs, sorted for stable output. */
  list(): string[] {
    return [...this.slugs].sort();
  }

  /** Whether the given resource slug has a `managed` attribute. */
  has(resource: string): boolean {
    return this.slugs.has(resource);
  }
}
