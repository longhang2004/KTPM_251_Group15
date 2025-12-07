import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard API response wrapper
 */
export class ResponseDto<T> {
  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiPropertyOptional({ description: 'Error details' })
  error?: string;

  constructor(params: {
    statusCode: number;
    message: string;
    data?: T;
    error?: string;
  }) {
    this.statusCode = params.statusCode;
    this.message = params.message;
    this.data = params.data;
    this.error = params.error;
  }
}

