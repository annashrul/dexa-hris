import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Global, Module } from '@nestjs/common';
import * as amqplib from 'amqplib';

export const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || 'hris.exchange';
export const QUEUE_EVENTS = process.env.RABBITMQ_QUEUE_EVENTS || 'hris.events';
export const EVENT_EMPLOYEE_PROFILE_UPDATED = 'employee.profile.updated';
export const EVENT_ATTENDANCE_SUBMITTED = 'attendance.submitted';

type AnyConn = any;
type AnyChannel = any;

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private conn: AnyConn = null;
  private channel: AnyChannel = null;
  private consumerTag: string | null = null;

  private get url(): string {
    return process.env.RABBITMQ_URL || 'amqp://hris:hris-dev-password-2026@localhost:5672';
  }

  async onModuleInit() {
    try {
      this.conn = (await amqplib.connect(this.url)) as AnyConn;
      this.channel = (await this.conn.createChannel()) as AnyChannel;
      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      await this.channel.assertQueue(QUEUE_EVENTS, { durable: true });
      await this.channel.bindQueue(QUEUE_EVENTS, EXCHANGE_NAME, '#');
      if (typeof this.channel.prefetch === 'function') this.channel.prefetch(10);
      this.logger.log(`Connected to RabbitMQ at ${this.url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    } catch (e: any) {
      this.logger.warn(`RabbitMQ unavailable (run "docker compose up"): ${e.message}. Events will be in-memory only.`);
      this.conn = null;
      this.channel = null;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.consumerTag && this.channel && this.channel.cancel) {
        await this.channel.cancel(this.consumerTag);
      }
    } catch {}
    try { if (this.channel && this.channel.close) await this.channel.close(); } catch {}
    try { if (this.conn && this.conn.close) await this.conn.close(); } catch {}
  }

  isConnected(): boolean {
    return !!this.channel && !!this.conn;
  }

  async publish(eventName: string, payload: any): Promise<boolean> {
    if (!this.channel) return false;
    const buffer = Buffer.from(JSON.stringify({
      eventName,
      payload,
      publishedAt: new Date().toISOString(),
    }));
    const ok = this.channel.publish(EXCHANGE_NAME, eventName, buffer, { persistent: true });
    if (!ok) this.logger.warn('RabbitMQ publish returned false (channel write buffer full)');
    else this.logger.debug(`Published event ${eventName} to RabbitMQ routing key '${eventName}'`);
    return true;
  }

  async startConsumer(handler: (eventName: string, payload: any, raw: any) => Promise<void> | void) {
    if (!this.channel) return;
    try {
      const res = await this.channel.consume(QUEUE_EVENTS, async (msg: any) => {
        if (!msg) return;
        try {
          const parsed = JSON.parse(msg.content.toString());
          await handler(parsed.eventName, parsed.payload, parsed);
          this.channel!.ack(msg);
        } catch (e: any) {
          this.logger.error(`Failed to process RabbitMQ event, nack: ${e.message}`);
          try { this.channel!.nack(msg, false, false); } catch {}
        }
      }, { noAck: false });
      this.consumerTag = res?.consumerTag || null;
      this.logger.log(`RabbitMQ consumer started on queue '${QUEUE_EVENTS}' (tag=${this.consumerTag})`);
    } catch (e: any) {
      this.logger.error(`Failed to start consumer: ${e.message}`);
    }
  }
}

@Global()
@Module({
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class MessagingModule {}
