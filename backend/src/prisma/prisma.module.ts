import { Global, Module } from '@nestjs/common';
import { PrismaMainService } from './prisma-main.service';
import { PrismaAuditService } from './prisma-audit.service';

@Global()
@Module({
  providers: [PrismaMainService, PrismaAuditService],
  exports: [PrismaMainService, PrismaAuditService],
})
export class PrismaModule {}
