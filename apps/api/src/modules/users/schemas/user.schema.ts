import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AbstractDocument } from '../../../common/infrastructure/database/abstract.schema';

export type UserDocument = HydratedDocument<User>;

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
}

@Schema({ timestamps: true, collection: 'users' })
export class User extends AbstractDocument {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ trim: true })
  firstName?: string;

  @Prop({ trim: true })
  lastName?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role!: UserRole;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ type: String, select: false, default: null })
  emailVerificationTokenHash?: string | null;

  @Prop({ type: Date, default: null })
  emailVerificationExpiresAt?: Date | null;

  @Prop({ type: String, select: false, default: null })
  passwordResetTokenHash?: string | null;

  @Prop({ type: Date, default: null })
  passwordResetExpiresAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastLoggedInAt?: Date | null;

  @Prop({
    type: String,
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  accountStatus!: AccountStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
