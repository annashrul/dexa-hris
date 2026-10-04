import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController, AdminAttendanceController } from './attendance.controller';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [AuthModule, LoggerModule],
  controllers: [AttendanceController, AdminAttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
