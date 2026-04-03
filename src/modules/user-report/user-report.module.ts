import { Module } from '@nestjs/common';
import { UserReportService } from './user-report.service';
import { UserReportController } from './user-report.controller';

@Module({
  controllers: [UserReportController],
  providers: [UserReportService],
  exports: [UserReportService],
})
export class UserReportModule {}
