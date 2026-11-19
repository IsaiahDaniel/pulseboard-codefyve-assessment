import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppErrorService } from '../../common/errors/app-error.service';
import { ProjectsService } from '../projects/projects.service';
import {
  CreateTaskDto,
  ListTasksQueryDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly projectsService: ProjectsService,
    private readonly errors: AppErrorService,
  ) {}

  private toObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) this.errors.badRequest('Invalid id');
    return new Types.ObjectId(id);
  }

  async create(projectId: string, userId: string, dto: CreateTaskDto) {
    await this.projectsService.assertMembership(projectId, userId);
    const task = await this.taskModel.create({
      projectId: this.toObjectId(projectId),
      title: dto.title,
      description: dto.description ?? '',
      status: dto.status ?? TaskStatus.TODO,
      priority: dto.priority,
      assigneeId: dto.assigneeId ? this.toObjectId(dto.assigneeId) : null,
      createdById: this.toObjectId(userId),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });
    return task.toObject();
  }

  async list(projectId: string, userId: string, query: ListTasksQueryDto) {
    await this.projectsService.assertMembership(projectId, userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const filter: Record<string, unknown> = {
      projectId: this.toObjectId(projectId),
    };
    if (query.status) filter.status = query.status;
    if (query.assigneeId) filter.assigneeId = this.toObjectId(query.assigneeId);
    if (query.q?.trim()) {
      const rx = new RegExp(
        query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      filter.$or = [{ title: rx }, { description: rx }];
    }

    const [items, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.taskModel.countDocuments(filter),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async get(projectId: string, taskId: string, userId: string) {
    await this.projectsService.assertMembership(projectId, userId);
    const task = await this.taskModel
      .findOne({
        _id: this.toObjectId(taskId),
        projectId: this.toObjectId(projectId),
      })
      .lean()
      .exec();
    if (!task) this.errors.notFound('Task');
    return task;
  }

  async update(
    projectId: string,
    taskId: string,
    userId: string,
    dto: UpdateTaskDto,
  ) {
    await this.projectsService.assertMembership(projectId, userId);
    const update: Record<string, unknown> = {};
    if (dto.title !== undefined) update.title = dto.title;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.status !== undefined) update.status = dto.status;
    if (dto.priority !== undefined) update.priority = dto.priority;
    if (dto.assigneeId !== undefined) {
      update.assigneeId =
        dto.assigneeId === null ? null : this.toObjectId(dto.assigneeId);
    }
    if (dto.dueDate !== undefined) {
      update.dueDate = dto.dueDate === null ? null : new Date(dto.dueDate);
    }

    const task = await this.taskModel
      .findOneAndUpdate(
        {
          _id: this.toObjectId(taskId),
          projectId: this.toObjectId(projectId),
        },
        update,
        { new: true },
      )
      .lean()
      .exec();
    if (!task) this.errors.notFound('Task');
    return task;
  }

  async remove(projectId: string, taskId: string, userId: string) {
    await this.projectsService.assertMembership(projectId, userId);
    const res = await this.taskModel
      .findOneAndDelete({
        _id: this.toObjectId(taskId),
        projectId: this.toObjectId(projectId),
      })
      .lean()
      .exec();
    if (!res) this.errors.notFound('Task');
    return { deleted: true };
  }
}
