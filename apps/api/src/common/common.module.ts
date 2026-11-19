import { Global, Module } from '@nestjs/common';
import { AppErrorService } from './errors/app-error.service';
import { DatabaseModule } from './infrastructure/database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AppErrorService],
  exports: [DatabaseModule, AppErrorService],
})
export class CommonModule {}
