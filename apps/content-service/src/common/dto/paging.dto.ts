import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassConstructor, Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '../constants/index';

export class PagingDto {
  @ApiPropertyOptional({ default: DEFAULT_PAGE_INDEX, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly pageIndex?: number = DEFAULT_PAGE_INDEX;

  @ApiPropertyOptional({ default: DEFAULT_PAGE_SIZE, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly pageSize?: number = DEFAULT_PAGE_SIZE;
}

export class PagingDataDto<T> {
  constructor(partial?: PagingDataDto<T>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  @Expose()
  count: number;

  @ApiProperty({ isArray: true })
  @Expose()
  rows: T[];

  static type<T>(cls: ClassConstructor<T>): typeof PagingDataDto<T> {
    class PagingDataDtoWithType extends PagingDataDto<T> {
      @ApiProperty({ type: cls, isArray: true })
      @Type(() => cls)
      declare rows: T[];
    }
    Object.defineProperty(PagingDataDtoWithType, 'name', {
      value: `Paging${cls.name}`,
    });
    return PagingDataDtoWithType;
  }
}
