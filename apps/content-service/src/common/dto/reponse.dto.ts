import { HttpStatus } from '@nestjs/common';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiPropertyOptions,
} from '@nestjs/swagger';
import { ClassConstructor, Expose, Type } from 'class-transformer';
import { ValidationErrorDto } from './validation-error.dto';

export class ResponseDto<T> {
  constructor(partial?: Partial<ResponseDto<T>>) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: HttpStatus.OK })
  @Expose()
  statusCode: number = HttpStatus.OK;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty()
  @Expose()
  data: T;

  @ApiPropertyOptional({ type: ValidationErrorDto, isArray: true })
  @Expose()
  @Type(() => ValidationErrorDto)
  errors?: ValidationErrorDto[];

  static type<T>(
    cls: ClassConstructor<T> | null = null,
    options: ApiPropertyOptions = {},
  ): typeof ResponseDto<T> {
    class ResponseDtoWithType extends ResponseDto<T> {
      @ApiProperty({
        ...options,
        type: cls || 'null',
        example: cls === null ? null : undefined,
        required: cls !== null,
      })
      @Type(() => cls || Object)
      declare data: T;
    }
    Object.defineProperty(ResponseDtoWithType, 'name', {
      value: cls === null ? `ResponseDto` : `Response${cls?.name}`,
    });
    return ResponseDtoWithType;
  }
}
