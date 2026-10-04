import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { NotificationModule } from './modules/notification/notification.module';
import { LoggerModule } from './modules/logger/logger.module';
import { MessagingModule } from './modules/messaging/messaging.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    PrismaModule,
    MessagingModule,
    AuthModule,
    EmployeeModule,
    AttendanceModule,
    NotificationModule,
    LoggerModule,
  ],
})
export class AppModule {}
