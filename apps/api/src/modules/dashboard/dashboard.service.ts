import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Project,
  ProjectDocument,
} from '../projects/schemas/project.schema';
import { Task, TaskDocument, TaskStatus } from '../tasks/schemas/task.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  async overview(userId: string) {
    const uid = new Types.ObjectId(userId);
    const projects = await this.projectModel
      .find({ 'members.userId': uid, archived: false })
      .select('_id name members')
      .lean()
      .exec();
    const projectIds = projects.map((p) => p._id);

    const [byStatus, assignedToMe, recentTasks] = await Promise.all([
      this.taskModel.aggregate<{ _id: string; count: number }>([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.taskModel.countDocuments({
        projectId: { $in: projectIds },
        assigneeId: uid,
        status: { $ne: TaskStatus.DONE },
      }),
      this.taskModel
        .find({ projectId: { $in: projectIds } })
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean()
        .exec(),
    ]);

    const statusCounts: Record<string, number> = {
      todo: 0,
      in_progress: 0,
      blocked: 0,
      done: 0,
    };
    for (const row of byStatus) statusCounts[row._id] = row.count;
    const totalTasks = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const completed = statusCounts.done ?? 0;

    return {
      projectsCount: projects.length,
      totalTasks,
      completedTasks: completed,
      openTasks: totalTasks - completed,
      assignedToMeOpen: assignedToMe,
      completionRate:
        totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100),
      statusCounts,
      recentTasks,
      projects: projects.map((p) => ({
        id: String(p._id),
        name: p.name,
        memberCount: p.members?.length ?? 0,
      })),
    };
  }

  async projectProgress(projectId: string) {
    const pid = new Types.ObjectId(projectId);
    const [byStatus, byAssignee] = await Promise.all([
      this.taskModel.aggregate<{ _id: string; count: number }>([
        { $match: { projectId: pid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.taskModel.aggregate<{ _id: Types.ObjectId | null; count: number }>([
        { $match: { projectId: pid } },
        { $group: { _id: '$assigneeId', count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts: Record<string, number> = {
      todo: 0,
      in_progress: 0,
      blocked: 0,
      done: 0,
    };
    for (const row of byStatus) statusCounts[row._id] = row.count;
    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return {
      totalTasks: total,
      outstanding: total - (statusCounts.done ?? 0),
      completed: statusCounts.done ?? 0,
      statusCounts,
      completionRate: total === 0 ? 0 : Math.round(((statusCounts.done ?? 0) / total) * 100),
      assigneeLoad: byAssignee.map((r) => ({
        assigneeId: r._id ? String(r._id) : null,
        count: r.count,
      })),
    };
  }
}
