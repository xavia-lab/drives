import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UseInterceptors,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

/**
 * Interface to ensure the DTO passed to the interceptor is a class
 */
interface ClassConstructor {
  new (...args: unknown[]): object; // Fixed: replaced 'any[]' and '{}' with 'unknown[]' and 'object'
}

/**
 * Custom decorator to simplify applying the serialization logic in controllers.
 * Usage: @Serialize(UserResponseDto)
 */
export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: ClassConstructor) {} // Fixed: typed with ClassConstructor instead of any

  intercept(
    context: ExecutionContext,
    handler: CallHandler,
  ): Observable<unknown> {
    return handler.handle().pipe(
      map((response: unknown) => {
        /**
         * Helper function to handle individual item transformation.
         * 1. Detects if it's a Sequelize instance and gets plain data.
         * 2. Uses plainToInstance to strip any fields NOT marked with @Expose() in the DTO.
         */
        const transform = (item: unknown): unknown => {
          if (!item) return item;

          // Convert Sequelize instance to plain object safely if it has a .get method
          const plainItem =
            typeof item === 'object' &&
            'get' in item &&
            typeof (item as Record<string, unknown>).get === 'function'
              ? (item as { get: (options: { plain: boolean }) => unknown }).get(
                  { plain: true },
                )
              : item;

          return plainToInstance(this.dto, plainItem, {
            excludeExtraneousValues: true, // Crucial: strips non-@Expose() fields
            enableImplicitConversion: true,
            exposeDefaultValues: true,
            ignoreDecorators: false,
          });
        };

        // Ensure response is an object before running key lookups
        if (response && typeof response === 'object') {
          // CASE 1: Paginated Response { data: [...], meta: {...}, total: 10 }
          if (
            'data' in response &&
            Array.isArray((response as Record<string, unknown>).data)
          ) {
            const paginated = response as { data: unknown[] };
            return {
              ...response,
              data: paginated.data.map((item: unknown) => transform(item)),
            };
          }
        }

        // CASE 2: Plain Array [{}, {}]
        if (Array.isArray(response)) {
          return response.map((item: unknown) => transform(item));
        }

        // CASE 3: Single Object {}
        return transform(response);
      }),
    );
  }
}
