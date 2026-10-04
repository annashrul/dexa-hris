import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaMainService } from '../../prisma/prisma-main.service';
import { MessageQueueService, EVENT_EMPLOYEE_PROFILE_UPDATED } from '../logger/logger.module';
import { Role } from '@prisma/client-main';

export interface CreateEmployeeDto {
  name: string;
  email: string;
  password: string;
  position: string;
  phone?: string;
  photo?: string;
  role?: Role;
}

export interface UpdateEmployeeDto {
  name?: string;
  email?: string;
  password?: string;
  position?: string;
  phone?: string;
  photo?: string;
  role?: Role;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  photo?: string;
  oldPassword?: string;
  newPassword?: string;
}

export interface ChangeField {
  field: string;
  oldValue: any;
  newValue: any;
}

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaMainService,
    private readonly mqService: MessageQueueService,
  ) {}

  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already exists');
    const hashed = await bcrypt.hash(dto.password, 10);
    const emp = await this.prisma.employee.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        position: dto.position,
        phone: dto.phone || '',
        photo: dto.photo || '',
        role: dto.role || Role.EMPLOYEE,
      },
    });
    return this.stripPassword(emp);
  }

  async findAll(opts?: {
    page?: number;
    limit?: number;
    search?: string;
    position?: string;
    status?: string;
    role?: string;
  }) {
    const page = Math.max(1, Number(opts?.page ?? 1));
    const limit = Math.min(200, Math.max(1, Number(opts?.limit ?? 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (opts?.search?.trim()) {
      const q = `%${opts.search.trim().toLowerCase()}%`;
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { position: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (opts?.position && opts.position !== 'All') {
      where.position = { contains: opts.position, mode: 'insensitive' };
    }
    if (opts?.status && opts.status !== 'All') {
      // no native status column yet; mapped to role-ish. Fallback ignore if unknown.
      if (opts.status.toLowerCase() === 'active') where.role = { not: 'HRD' } as any;
    }
    if (opts?.role && opts.role !== 'All') {
      where.role = opts.role;
    }

    const [rows, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      rows: rows.map((x) => this.stripPassword(x)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new BadRequestException('Employee not found');
    return this.stripPassword(emp);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const current = await this.prisma.employee.findUnique({ where: { id } });
    if (!current) throw new BadRequestException('Employee not found');
    if (dto.email && dto.email !== current.email) {
      const existing = await this.prisma.employee.findUnique({ where: { email: dto.email } });
      if (existing) throw new BadRequestException('Email already exists');
    }

    const data: any = {};
    const changes: ChangeField[] = [];
    for (const f of ['name', 'email', 'position', 'phone', 'photo', 'role'] as const) {
      const val = (dto as any)[f];
      if (val !== undefined && val !== (current as any)[f]) {
        changes.push({ field: f, oldValue: (current as any)[f], newValue: val });
        data[f] = val;
      }
    }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
      changes.push({ field: 'password', oldValue: '***', newValue: '***' });
    }

    const updated = await this.prisma.employee.update({ where: { id }, data });
    const stripped = this.stripPassword(updated);

    if (changes.length > 0) {
      await this.mqService.publish(EVENT_EMPLOYEE_PROFILE_UPDATED, {
        eventName: EVENT_EMPLOYEE_PROFILE_UPDATED,
        employeeId: id,
        changedFields: changes.map((c) => c.field),
        occurredAt: new Date().toISOString(),
        entityType: 'employee',
        entityId: id,
        changes,
        triggeredBy: 'hrd',
        name: updated.name,
        message: `HRD updated data for employee ${updated.name}. Changed: ${changes.map(c => c.field).join(', ')}`,
      });
    }
    return stripped;
  }

  async updateSelf(userId: string, dto: UpdateProfileDto) {
    const current = await this.prisma.employee.findUnique({ where: { id: userId } });
    if (!current) throw new ForbiddenException('User not found');

    const changes: ChangeField[] = [];
    const data: any = {};
    for (const f of ['name', 'phone', 'photo'] as const) {
      const val = (dto as any)[f];
      if (val !== undefined && val !== (current as any)[f]) {
        changes.push({ field: f, oldValue: (current as any)[f], newValue: val });
        data[f] = val;
      }
    }
    if (dto.newPassword) {
      if (!dto.oldPassword) throw new BadRequestException('oldPassword required to change password');
      const match = await bcrypt.compare(dto.oldPassword, current.password);
      if (!match) throw new BadRequestException('Old password is incorrect');
      if (dto.newPassword.length < 6) throw new BadRequestException('New password too short');
      data.password = await bcrypt.hash(dto.newPassword, 10);
      changes.push({ field: 'password', oldValue: '***', newValue: '***' });
    }

    if (changes.length === 0 && !dto.newPassword) {
      return this.stripPassword(current);
    }

    const updated = await this.prisma.employee.update({ where: { id: userId }, data });
    const stripped = this.stripPassword(updated);

    if (changes.length > 0) {
      await this.mqService.publish(EVENT_EMPLOYEE_PROFILE_UPDATED, {
        eventName: EVENT_EMPLOYEE_PROFILE_UPDATED,
        employeeId: userId,
        changedFields: changes.map((c) => c.field),
        occurredAt: new Date().toISOString(),
        entityType: 'employee',
        entityId: userId,
        changes,
        triggeredBy: userId,
        name: updated.name,
        message: `Employee ${updated.name} updated their profile. Changes: ${changes.map((c) => c.field).join(', ')}.`,
      });
    }
    return stripped;
  }

  private stripPassword<T extends { password?: string }>(e: T): Omit<T, 'password'> {
    const { password, ...rest } = e as any;
    return rest;
  }
}
