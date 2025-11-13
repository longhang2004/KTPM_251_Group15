import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  password: string;
}
