import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { AuthUser } from '../../common/guards/auth.guard';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  status() {
    return {
      ready: true,
      message: 'Auth ready — email/password + JWT',
    };
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-email')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  verifyEmail(@CurrentUser() user: AuthUser, @Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(user.sub, dto);
  }

  @Post('resend-verification')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  resendVerification(@CurrentUser() user: AuthUser) {
    return this.authService.resendVerification(user.sub);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.sub);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.sub, dto);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, dto);
  }
}
