import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('set-password')
  @Public()
  async setPassword(@Body() dto: SetPasswordDto) {
    return this.auth.setPassword(dto);
  }

  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    console.log('AuthController.me: Request user:', (req as any).user);
    console.log('AuthController.me: Extracted userId:', userId);

    const user = await this.auth.me(userId);
    console.log('AuthController.me: User from database:', user);

    return user;
  }

  @Post('logout')
  @Public()
  async logout() {
    return { ok: true };
  }
}
