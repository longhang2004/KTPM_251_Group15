import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

//---- Verify token ----//
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context) {
    return super.canActivate(context);
  }
}
