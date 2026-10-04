import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService, CheckInOutDto, SummaryFilterDto, AdminRecordsFilterDto } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role, AttendanceStatus } from '@prisma/client-main';
import { IsEnum, IsOptional, IsString, Matches, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class AttendanceSubmitDto {
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

class SummaryQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

class AdminAttendanceQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsString()
  mode?: string;
}

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/check-in')
  checkIn(@Request() req: any) {
    return this.service.submit(req.user.id, { status: AttendanceStatus.MASUK });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/check-out')
  checkOut(@Request() req: any) {
    return this.service.submit(req.user.id, { status: AttendanceStatus.PULANG });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/today')
  myToday(@Request() req: any) {
    return this.service.getMyToday(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  mySummary(@Request() req: any, @Query() q: SummaryQueryDto) {
    return this.service.getMySummary(req.user.id, q as SummaryFilterDto);
  }
}

@ApiTags('HRD / Admin Attendance')
@Controller('admin/attendance')
export class AdminAttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HRD)
  @Get()
  allSummary(
    @Request() req: any,
    @Query() q: AdminAttendanceQueryDto,
  ) {
    if (q.mode === 'records' || q.search || q.page || q.limit) {
      const opts: AdminRecordsFilterDto = {
        from: q.from,
        to: q.to,
        search: q.search,
        page: q.page ?? 1,
        limit: q.limit ?? 10,
      };
      return this.service.getAllRecordsPaginated(opts, req.user.role);
    }
    return this.service.getAllSummary({ from: q.from, to: q.to, employeeId: q.employeeId }, req.user.role);
  }
}
