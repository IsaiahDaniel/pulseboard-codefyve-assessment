import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AccountStatus,
  User,
  UserDocument,
  UserRole,
} from './schemas/user.schema';

export type PublicUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  accountStatus: AccountStatus;
  lastLoggedInAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  toPublic(user: UserDocument | User): PublicUser {
    return {
      id: String(user._id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      accountStatus: user.accountStatus,
      lastLoggedInAt: user.lastLoggedInAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  create(input: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: UserRole;
  }) {
    return this.userModel.create({
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
    });
  }

  async setEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      })
      .exec();
  }

  findByEmailVerificationTokenHash(tokenHash: string) {
    return this.userModel
      .findOne({
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { $gt: new Date() },
      })
      .select('+emailVerificationTokenHash')
      .exec();
  }

  markEmailVerified(userId: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          isEmailVerified: true,
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
        },
        { new: true },
      )
      .exec();
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      })
      .exec();
  }

  findByPasswordResetTokenHash(tokenHash: string) {
    return this.userModel
      .findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
      })
      .select('+passwordResetTokenHash')
      .exec();
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      })
      .exec();
  }

  async touchLastLoggedIn(userId: string) {
    const now = new Date();
    await this.userModel
      .findByIdAndUpdate(userId, { lastLoggedInAt: now })
      .exec();
    return now;
  }

  updateProfile(
    userId: string,
    patch: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>,
  ) {
    return this.userModel
      .findByIdAndUpdate(userId, patch, { new: true })
      .exec();
  }
}
