import { HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class ResponseHandler {
  // Changed data type from 'any' to 'unknown'
  static success(
    data: unknown,
    message = 'Success',
    statusCode = HttpStatus.OK,
  ) {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }

  // Changed errors type from 'any' to 'unknown'
  static error(
    message = 'Error occurred',
    statusCode = HttpStatus.BAD_REQUEST,
    errors?: unknown,
  ) {
    return {
      success: false,
      message,
      errors,
      statusCode,
    };
  }
}
