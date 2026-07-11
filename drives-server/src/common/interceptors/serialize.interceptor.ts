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
  new (...args: any[]): {};
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
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((response: any) => {
        /**
         * Helper function to handle individual item transformation.
         * 1. Detects if it's a Sequelize instance and gets plain data.
         * 2. Uses plainToInstance to strip any fields NOT marked with @Expose() in the DTO.
         */
        const transform = (item: any) => {
          if (!item) return item;

          // Convert Sequelize instance to plain object if necessary
          const plainItem = item?.get ? item.get({ plain: true }) : item;

          return plainToInstance(this.dto, plainItem, {
            excludeExtraneousValues: true, // Crucial: strips non-@Expose() fields
            enableImplicitConversion: true,
            exposeDefaultValues: true,
            ignoreDecorators: false,
          });
        };

        // CASE 1: Paginated Response { data: [...], meta: {...}, total: 10 }
        // We detect the 'data' property and map over it while preserving metadata.
        if (response && response.data && Array.isArray(response.data)) {
          return {
            ...response,
            data: response.data.map((item: any) => transform(item)),
          };
        }

        // CASE 2: Plain Array [{}, {}]
        if (Array.isArray(response)) {
          return response.map((item: any) => transform(item));
        }

        // CASE 3: Single Object {}
        return transform(response);
      }),
    );
  }
}
