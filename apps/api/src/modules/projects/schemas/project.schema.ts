import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AbstractDocument } from '../../../common/infrastructure/database/abstract.schema';

export type ProjectDocument = HydratedDocument<Project>;

export enum ProjectMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Schema({ _id: false })
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ProjectMemberRole,
    default: ProjectMemberRole.MEMBER,
  })
  role!: ProjectMemberRole;

  @Prop({ type: Date, default: () => new Date() })
  joinedAt!: Date;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

@Schema({ timestamps: true, collection: 'projects' })
export class Project extends AbstractDocument {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, default: '' })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: [ProjectMemberSchema], default: [] })
  members!: ProjectMember[];

  @Prop({ default: false })
  archived!: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ 'members.userId': 1 });
