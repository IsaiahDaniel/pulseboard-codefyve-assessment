import {
  Body,
  Controller,
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
  AddProjectMemberDto,
  CreateProjectDto,
  ListProjectsQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListProjectsQueryDto) {
    return this.projectsService.listForUser(user.sub, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projectsService.getById(id, user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.sub, dto);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(id, user.sub, dto);
  }
}
