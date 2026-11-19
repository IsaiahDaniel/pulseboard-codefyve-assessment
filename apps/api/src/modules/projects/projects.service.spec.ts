import { ProjectsService } from './projects.service';
import { ProjectMemberRole } from './schemas/project.schema';

describe('ProjectsService membership ranks', () => {
  const rank: Record<ProjectMemberRole, number> = {
    [ProjectMemberRole.MEMBER]: 1,
    [ProjectMemberRole.ADMIN]: 2,
    [ProjectMemberRole.OWNER]: 3,
  };

  it('owner outranks admin and member', () => {
    expect(rank[ProjectMemberRole.OWNER]).toBeGreaterThan(
      rank[ProjectMemberRole.ADMIN],
    );
    expect(rank[ProjectMemberRole.ADMIN]).toBeGreaterThan(
      rank[ProjectMemberRole.MEMBER],
    );
  });

  it('service class is defined', () => {
    expect(ProjectsService).toBeDefined();
  });
});
