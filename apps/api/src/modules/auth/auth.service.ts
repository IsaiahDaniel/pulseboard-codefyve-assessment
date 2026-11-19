import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { AppErrorService } from '../../common/errors/app-error.service';
import { AccountStatus, UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly errors: AppErrorService,
  ) {}

  private async signToken(userId: string, email: string, role: string) {
    return this.jwtService.signAsync(
      { sub: userId, email, role },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ??
          '7d') as never,
      },
    );
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueEmailVerification(userId: string) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const tokenHash = this.hashToken(code);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await this.usersService.setEmailVerificationToken(
      userId,
      tokenHash,
      expiresAt,
    );
    return { code, expiresAt };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) this.errors.conflict('Email already registered');

    const role =
      dto.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.MEMBER;
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role,
    });

    const { code, expiresAt } = await this.issueEmailVerification(
      String(user._id),
    );
    const lastLoggedInAt = await this.usersService.touchLastLoggedIn(
      String(user._id),
    );
    user.lastLoggedInAt = lastLoggedInAt;

    const accessToken = await this.signToken(
      String(user._id),
      user.email,
      user.role,
    );

    return {
      message: 'Account created — verify your email to continue',
      accessToken,
      user: this.usersService.toPublic(user),
      verificationCode: code,
      verificationExpiresAt: expiresAt,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) this.errors.unauthorized('Invalid email or password');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) this.errors.unauthorized('Invalid email or password');

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      this.errors.forbidden('Account is not active');
    }

    const lastLoggedInAt = await this.usersService.touchLastLoggedIn(
      String(user._id),
    );
    user.lastLoggedInAt = lastLoggedInAt;

    const accessToken = await this.signToken(
      String(user._id),
      user.email,
      user.role,
    );

    return {
      message: 'Login successful',
      accessToken,
      user: this.usersService.toPublic(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) this.errors.unauthorized('User not found');
    return {
      message: 'Request successful',
      user: this.usersService.toPublic(user),
    };
  }

  async verifyEmail(userId: string, dto: VerifyEmailDto) {
    const user = await this.usersService.findById(userId);
    if (!user) this.errors.unauthorized('User not found');

    if (user.isEmailVerified) {
      return {
        message: 'Email already verified',
        user: this.usersService.toPublic(user),
      };
    }

    const tokenHash = this.hashToken(dto.code.trim());
    const match =
      await this.usersService.findByEmailVerificationTokenHash(tokenHash);
    if (!match || String(match._id) !== userId) {
      this.errors.badRequest('Invalid or expired verification code');
    }

    const updated = await this.usersService.markEmailVerified(userId);
    if (!updated) this.errors.notFound('User');

    return {
      message: 'Email verified',
      user: this.usersService.toPublic(updated),
    };
  }

  async resendVerification(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) this.errors.unauthorized('User not found');

    if (user.isEmailVerified) {
      return { message: 'Email already verified' };
    }

    const { code, expiresAt } = await this.issueEmailVerification(userId);
    return {
      message: 'Verification code sent',
      verificationCode: code,
      verificationExpiresAt: expiresAt,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const generic = {
      message:
        'If an account exists for that email, password reset instructions will be sent.',
    };
    if (!user) return generic;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersService.setPasswordResetToken(
      String(user._id),
      tokenHash,
      expiresAt,
    );

    return {
      ...generic,
      resetToken: rawToken,
      expiresAt,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const user =
      await this.usersService.findByPasswordResetTokenHash(tokenHash);
    if (!user) this.errors.badRequest('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.usersService.updatePassword(String(user._id), passwordHash);
    return { message: 'Password updated successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) this.errors.unauthorized('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) this.errors.badRequest('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, passwordHash);
    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(userId, dto);
    if (!updated) this.errors.unauthorized('User not found');
    return {
      message: 'Profile updated',
      user: this.usersService.toPublic(updated),
    };
  }
}
