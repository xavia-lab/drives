import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';

@Catch(BadRequestException)
export class QueryParamsExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    // Explicit structural type prevents unsafe "any" method calls
    const response = ctx.getResponse<{
      status: (statusCode: number) => {
        json: (body: Record<string, unknown>) => void;
      };
    }>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Use a structural record type assertion instead of any
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>).message ||
          'Bad request';

    response.status(status).json({
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
