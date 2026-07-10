import { HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class ResponseHandler {
  static success(data: any, message = 'Success', statusCode = HttpStatus.OK) {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }

  static error(
    message = 'Error occurred',
    statusCode = HttpStatus.BAD_REQUEST,
    errors?: any,
  ) {
    return {
      success: false,
      message,
      errors,
      statusCode,
    };
  }
}
