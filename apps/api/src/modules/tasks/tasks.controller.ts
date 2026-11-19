import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { AuthUser } from '../../common/guards/auth.guard';
import {
  CreateTaskDto,
  ListTasksQueryDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, user.sub, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: ListTasksQueryDto,
  ) {
    return this.tasksService.list(projectId, user.sub, query);
  }

  @Get(':taskId')
  get(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.get(projectId, taskId, user.sub);
  }

  @Patch(':taskId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(projectId, taskId, user.sub, dto);
  }

  @Delete(':taskId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.remove(projectId, taskId, user.sub);
  }
}
