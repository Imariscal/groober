import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

interface ValidationErrorResponse {
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  errors?: Record<string, string[]>;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ValidationExceptionFilter');

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const exceptionResponse = exception.getResponse() as any;
    const validationErrors = exceptionResponse.message;

    // Estructura los errores de validación
    const formattedErrors: Record<string, string[]> = {};
    let simpleMessage = '';

    // Log inicial para debugging
    this.logger.error(`Raw validation errors:`, JSON.stringify(validationErrors));

    // Si es un string simple, devolver como mensaje general
    if (typeof validationErrors === 'string') {
      simpleMessage = validationErrors;
    } else if (Array.isArray(validationErrors)) {
      validationErrors.forEach((error: ValidationError | any) => {
        if (error && typeof error === 'object') {
          const property = error.property || error.field;
          const constraints = error.constraints || error.messages;
          
          if (property && constraints) {
            formattedErrors[property] = Array.isArray(constraints) 
              ? constraints 
              : Object.values(constraints) as string[];
          }
        } else if (typeof error === 'string') {
          simpleMessage = error;
        }
      });
    }

    const errorResponse: ValidationErrorResponse = {
      message: simpleMessage || 'Validation failed',
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      errors: Object.keys(formattedErrors).length > 0 ? formattedErrors : undefined,
    };

    this.logger.error(`Formatted errors:`, JSON.stringify(formattedErrors, null, 2));
    this.logger.error(`Full response:`, JSON.stringify(errorResponse, null, 2));

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
