import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AbstractDocument } from '../../../common/infrastructure/database/abstract.schema';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true, collection: 'tasks' })
export class Task extends AbstractDocument {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true, default: '' })
  description!: string;

  @Prop({
    type: String,
    enum: TaskStatus,
    default: TaskStatus.TODO,
    index: true,
  })
  status!: TaskStatus;

  @Prop({
    type: String,
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assigneeId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdById!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  dueDate?: Date | null;

  @Prop({ type: Number, default: 0 })
  order!: number;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ projectId: 1, assigneeId: 1 });
