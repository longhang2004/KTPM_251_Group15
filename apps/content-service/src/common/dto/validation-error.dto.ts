import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ValidationErrorDto {
  @ApiProperty()
  @Expose()
  property: string;

  @ApiPropertyOptional({ type: () => ValidationErrorDto, isArray: true })
  @Expose()
  children?: ValidationErrorDto[];

  @ApiPropertyOptional({ example: { isNotEmpty: 'should not be empty' } })
  @Expose()
  constraints?: Record<string, string>;

  @ApiPropertyOptional({
    example: { name: 'John', appName: 'Fundify' },
  })
  @Expose()
  args?: Record<string, string>;
}
