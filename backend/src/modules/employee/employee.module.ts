import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController, AdminEmployeeController } from './employee.controller';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [AuthModule, LoggerModule],
  controllers: [EmployeeController, AdminEmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
