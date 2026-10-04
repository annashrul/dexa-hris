import { Injectable, Module, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaAuditService } from '../../prisma/prisma-audit.service';
import { RabbitMQService, EVENT_EMPLOYEE_PROFILE_UPDATED, EVENT_ATTENDANCE_SUBMITTED } from '../messaging/messaging.module';

export { EVENT_EMPLOYEE_PROFILE_UPDATED, EVENT_ATTENDANCE_SUBMITTED } from '../messaging/messaging.module';
export const EVENT_EMPLOYEE_UPDATED = EVENT_EMPLOYEE_PROFILE_UPDATED;
export const EVENT_ATTENDANCE_CREATED = EVENT_ATTENDANCE_SUBMITTED;

@Injectable()
export class MessageQueueService {
  private readonly logger = new Logger(MessageQueueService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly rabbit: RabbitMQService,
    private readonly prismaAudit: PrismaAuditService,
  ) {}

  async publish(event: string, payload: any) {
    this.logger.debug(`[MQ] Emitting event ${event} via global EventEmitter`);
    this.eventEmitter.emit(event, payload);

    let auditInserted = false;
    if (event === EVENT_EMPLOYEE_PROFILE_UPDATED || event === EVENT_ATTENDANCE_SUBMITTED) {
      try {
        await this.prismaAudit.changeLog.create({
          data: {
            entityType: payload.entityType || '',
            entityId: payload.entityId || '',
            eventType: event,
            changedFields: (payload.changedFields || []) as any,
            changes: (payload.changes || []) as any,
            triggeredBy: String(payload.triggeredBy || ''),
            occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
          },
        });
        auditInserted = true;
      } catch (e: any) {
        this.logger.warn(`Could not insert audit row directly (will rely on RabbitMQ consumer): ${e.message}`);
      }
    }

    try {
      const ok = await this.rabbit.publish(event, payload);
      if (!ok) {
        this.logger.verbose(`RabbitMQ not connected for ${event}, EventEmitter-only mode OK.`);
      }
    } catch (e: any) {
      this.logger.warn(`RabbitMQ publish failed: ${e.message}. Event was still emitted via EventEmitter.`);
    }

    return {
      eventEmitted: true,
      auditInserted,
    };
  }
}

@Injectable()
export class AuditConsumer implements OnModuleInit {
  private readonly logger = new Logger(AuditConsumer.name);

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly prismaAudit: PrismaAuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.rabbit.startConsumer(async (eventName, payload) => {
      if (
        eventName === EVENT_EMPLOYEE_PROFILE_UPDATED ||
        eventName === EVENT_ATTENDANCE_SUBMITTED
      ) {
        try {
          await this.prismaAudit.changeLog.create({
            data: {
              entityType: payload.entityType || '',
              entityId: payload.entityId || '',
              eventType: eventName,
              changedFields: (payload.changedFields || []) as any,
              changes: (payload.changes || []) as any,
              triggeredBy: String(payload.triggeredBy || ''),
              occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
            },
          });
          this.logger.debug(`Audit persisted via RabbitMQ consumer: ${eventName} ${payload.entityId || ''}`);
        } catch (e: any) {
          this.logger.error(`Audit DB consumer write failed: ${e.message}`);
        }
      }
      this.eventEmitter.emit(eventName, payload);
    });
  }
}

@Module({
  providers: [MessageQueueService, AuditConsumer],
  exports: [MessageQueueService],
})
export class LoggerModule {}
