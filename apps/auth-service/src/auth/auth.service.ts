import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Tạo user mới
    const user = await this.userService.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
    });

    return user;
  }

  async login(dto: LoginDto) {
    // Tìm user bằng email
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tạo JWT payload
    const payload = { sub: user.id, email: user.email };

    // Ký token
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
    };
  }

  async validateUser(payload: { sub: string; email?: string }) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    // Trả về user với roles để JWT strategy có thể sử dụng
    return user;
  }
}
