import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppErrorService } from '../../common/errors/app-error.service';
import { UsersService } from '../users/users.service';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './dto/project.dto';
import {
  Project,
  ProjectDocument,
  ProjectMemberRole,
} from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly usersService: UsersService,
    private readonly errors: AppErrorService,
  ) {}

  private toObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) this.errors.badRequest('Invalid id');
    return new Types.ObjectId(id);
  }

  async assertMembership(
    projectId: string,
    userId: string,
    minRole: ProjectMemberRole = ProjectMemberRole.MEMBER,
  ) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project || project.archived) this.errors.notFound('Project');

    const member = project.members.find(
      (m) => String(m.userId) === String(userId),
    );
    if (!member) this.errors.forbidden('Not a member of this project');

    const rank: Record<ProjectMemberRole, number> = {
      [ProjectMemberRole.MEMBER]: 1,
      [ProjectMemberRole.ADMIN]: 2,
      [ProjectMemberRole.OWNER]: 3,
    };
    if (rank[member.role] < rank[minRole]) {
      this.errors.forbidden('Insufficient project role');
    }
    return project;
  }

  async create(userId: string, dto: CreateProjectDto) {
    const ownerId = this.toObjectId(userId);
    const project = await this.projectModel.create({
      name: dto.name,
      description: dto.description ?? '',
      ownerId,
      members: [
        {
          userId: ownerId,
          role: ProjectMemberRole.OWNER,
          joinedAt: new Date(),
        },
      ],
    });
    return project.toObject();
  }

  async listForUser(
    userId: string,
    query: { q?: string; page?: number; limit?: number } = {},
  ) {
    const uid = this.toObjectId(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: Record<string, unknown> = {
      'members.userId': uid,
      archived: false,
    };
    if (query.q?.trim()) {
      const rx = new RegExp(query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { description: rx }];
    }

    const [items, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.projectModel.countDocuments(filter),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getById(projectId: string, userId: string) {
    const project = await this.assertMembership(projectId, userId);
    return project.toObject();
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.assertMembership(projectId, userId, ProjectMemberRole.ADMIN);
    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.archived !== undefined ? { archived: dto.archived } : {}),
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!updated) this.errors.notFound('Project');
    return updated;
  }

  async addMember(
    projectId: string,
    actorId: string,
    dto: AddProjectMemberDto,
  ) {
    await this.assertMembership(projectId, actorId, ProjectMemberRole.ADMIN);
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) this.errors.notFound('User');

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) this.errors.notFound('Project');

    const already = project.members.some(
      (m) => String(m.userId) === String(user._id),
    );
    if (already) this.errors.conflict('User is already a project member');

    const role =
      dto.role && dto.role !== ProjectMemberRole.OWNER
        ? dto.role
        : ProjectMemberRole.MEMBER;

    project.members.push({
      userId: user._id as Types.ObjectId,
      role,
      joinedAt: new Date(),
    });
    await project.save();
    return project.toObject();
  }
}
