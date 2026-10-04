import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService, CreateEmployeeDto, UpdateEmployeeDto, UpdateProfileDto } from './employee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client-main';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';

class CreateEmployeeRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

class UpdateEmployeeRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

class UpdateProfileRequestDto {
  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}

class AdminEmployeesQueryDto {
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
  search?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

@ApiTags('Employees')
@Controller('employees')
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: any) {
    return this.service.findById(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateMe(@Request() req: any, @Body() dto: UpdateProfileRequestDto) {
    return this.service.updateSelf(req.user.id, dto as UpdateProfileDto);
  }
}

@ApiTags('HRD / Admin Employees')
@Controller('admin/employees')
export class AdminEmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HRD)
  @Get()
  findAll(@Query() q: AdminEmployeesQueryDto) {
    return this.service.findAll({
      page: q.page ?? 1,
      limit: q.limit ?? 10,
      search: q.search,
      position: q.position,
      status: q.status,
      role: q.role,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HRD)
  @Post()
  create(@Body() dto: CreateEmployeeRequestDto) {
    if (!dto.email || !dto.name || !dto.password || !dto.position) {
      throw new BadRequestException('Missing required fields');
    }
    return this.service.create(dto as CreateEmployeeDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HRD)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HRD)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeRequestDto) {
    return this.service.update(id, dto as UpdateEmployeeDto);
  }
}
