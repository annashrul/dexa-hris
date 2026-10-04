import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaMainService } from '../../prisma/prisma-main.service';
import { MessageQueueService, EVENT_ATTENDANCE_SUBMITTED } from '../logger/logger.module';
import { AttendanceStatus, Role } from '@prisma/client-main';

export interface CheckInOutDto {
  status: AttendanceStatus;
}

export interface SummaryFilterDto {
  from?: string;
  to?: string;
  employeeId?: string;
}

export interface AdminRecordsFilterDto {
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaMainService,
    private readonly mqService: MessageQueueService,
  ) {}

  async submit(userId: string, dto: CheckInOutDto) {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8);

    const emp = await this.prisma.employee.findUnique({ where: { id: userId } });
    if (!emp) throw new BadRequestException('Employee not found');

    const existing = await this.prisma.attendance.findFirst({
      where: { employeeId: userId, date, status: dto.status },
    });
    if (existing) {
      throw new BadRequestException(
        `You have already checked ${dto.status === AttendanceStatus.MASUK ? 'in' : 'out'} today.`,
      );
    }
    if (dto.status === AttendanceStatus.PULANG) {
      const masuk = await this.prisma.attendance.findFirst({
        where: { employeeId: userId, date, status: AttendanceStatus.MASUK },
      });
      if (!masuk) {
        throw new BadRequestException('Please check-in first before checking out.');
      }
    }

    const saved = await this.prisma.attendance.create({
      data: {
        employeeId: userId,
        date,
        time,
        status: dto.status,
      },
    });

    await this.mqService.publish(EVENT_ATTENDANCE_SUBMITTED, {
      eventName: EVENT_ATTENDANCE_SUBMITTED,
      employeeId: userId,
      changedFields: ['attendance'],
      occurredAt: new Date().toISOString(),
      entityType: 'attendance',
      entityId: saved.id,
      changes: [{ field: 'new', oldValue: null, newValue: { date, time, status: dto.status } }],
      triggeredBy: userId,
      employeeName: emp.name,
      employeeEmail: emp.email,
      message: `${emp.name} submitted attendance ${dto.status} at ${time} on ${date}.`,
    });

    return {
      ...saved,
      employeeName: emp.name,
    };
  }

  async getMyToday(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.prisma.attendance.findMany({
      where: { employeeId: userId, date: today },
      orderBy: [{ status: 'asc' }],
    });
    const status: any = { checkIn: null, checkOut: null };
    rows.forEach((r) => {
      if (r.status === AttendanceStatus.MASUK) status.checkIn = r;
      else status.checkOut = r;
    });
    return { date: today, ...status, list: rows };
  }

  async getMySummary(userId: string, filter: SummaryFilterDto) {
    const { from, to } = this.resolveRange(filter);
    const rows = await this.prisma.attendance.findMany({
      where: { employeeId: userId, date: { gte: from, lte: to } },
      include: { employee: { select: { name: true, email: true, position: true } } },
      orderBy: [{ date: 'desc' }, { status: 'asc' }],
    });
    return this.pairCheckInOut(rows, from, to);
  }

  async getAllSummary(filter: SummaryFilterDto, adminRole?: string) {
    if (adminRole !== Role.HRD) {
      throw new ForbiddenException('Only HRD can view all attendance');
    }
    const { from, to } = this.resolveRange(filter);
    const where: any = { date: { gte: from, lte: to } };
    if (filter.employeeId) where.employeeId = filter.employeeId;
    const rows = await this.prisma.attendance.findMany({
      where,
      include: { employee: { select: { name: true, email: true, position: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return this.pairCheckInOut(rows, from, to);
  }

  async getAllRecordsPaginated(filter: AdminRecordsFilterDto, adminRole?: string) {
    if (adminRole !== Role.HRD) {
      throw new ForbiddenException('Only HRD can view all attendance');
    }
    const { from, to } = this.resolveRange(filter);
    const page = Math.max(1, Number(filter.page ?? 1));
    const limit = Math.min(200, Math.max(1, Number(filter.limit ?? 10)));
    const skip = (page - 1) * limit;

    const search = filter.search?.trim();
    const where: any = { date: { gte: from, lte: to } };

    let employeeIdsFilter: string[] | undefined;
    if (search) {
      const employees = await this.prisma.employee.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { position: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      employeeIdsFilter = employees.map((e) => String(e.id));
      if (employeeIdsFilter.length === 0) {
        return {
          rows: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
          summary: {
            range: { from, to },
            total: 0,
            uniqueEmployees: 0,
            masukCount: 0,
            pulangCount: 0,
          },
        };
      }
      where.employeeId = { in: employeeIdsFilter };
    }

    const [rows, total, allForSummary] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: { employee: { select: { name: true, email: true, position: true } } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        include: { employee: { select: { name: true, email: true, position: true } } },
      }),
    ]);

    const pair = this.pairCheckInOut(allForSummary, from, to);

    return {
      rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        range: pair.range,
        total: pair.total,
        uniqueEmployees: pair.uniqueEmployees,
        masukCount: pair.masukCount,
        pulangCount: pair.pulangCount,
      },
    };
  }

  private pairCheckInOut(rows: any[], from: string, to: string) {
    const byDate = new Map<string, any>();
    rows.forEach((r) => {
      const key = r.date + '::' + r.employeeId;
      if (!byDate.has(key)) {
        byDate.set(key, {
          date: r.date,
          employeeId: r.employeeId,
          employeeName: r.employee?.name,
          employeeEmail: r.employee?.email,
          employeePosition: r.employee?.position,
          masuk: null,
          pulang: null,
        });
      }
      const row = byDate.get(key);
      if (r.status === AttendanceStatus.MASUK) row.masuk = r;
      else row.pulang = r;
    });
    const summary = Array.from(byDate.values()).sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
    );
    const masukCount = summary.filter((s) => s.masuk).length;
    const pulangCount = summary.filter((s) => s.pulang).length;
    const uniqueEmployees = new Set(summary.map((s) => s.employeeId)).size;
    return {
      range: { from, to },
      total: summary.length,
      uniqueEmployees,
      masukCount,
      pulangCount,
      rows: summary,
    };
  }

  private resolveRange(filter: SummaryFilterDto) {
    const today = new Date();
    let from = filter.from;
    let to = filter.to;
    if (!from) {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      from = d.toISOString().slice(0, 10);
    }
    if (!to) {
      to = today.toISOString().slice(0, 10);
    }
    return { from, to };
  }
}
