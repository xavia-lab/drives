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
    // Typing as any or a structural record lets you call .status().json()
    // safely without importing the heavy third-party Express types
    const response = ctx.getResponse<any>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Bad request';

    response.status(status).json({
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
