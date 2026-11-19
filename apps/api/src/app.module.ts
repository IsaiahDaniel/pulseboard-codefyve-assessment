import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { envValidationSchema } from './common/config/env.validation';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', path.resolve(__dirname, '..', '.env')],
      validationSchema: envValidationSchema,
    }),
    CommonModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    DashboardModule,
  ],
})
export class AppModule {}
