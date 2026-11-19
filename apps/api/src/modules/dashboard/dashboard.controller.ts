import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { AuthUser } from '../../common/guards/auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get('dashboard')
  overview(@CurrentUser() user: AuthUser) {
    return this.dashboardService.overview(user.sub);
  }

  @Get('projects/:id/progress')
  async progress(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.projectsService.assertMembership(id, user.sub);
    return this.dashboardService.projectProgress(id);
  }
}
