import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as PrismaAuditClient } from '@prisma/client-audit';

@Injectable()
export class PrismaAuditService
  extends PrismaAuditClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (e) {
      console.warn('[PrismaAudit] Audit DB connection failed (run docker compose up). Audit will be written to RabbitMQ instead.', e.message);
    }
  }

  async onModuleDestroy() {
    try { await this.$disconnect(); } catch {}
  }
}
