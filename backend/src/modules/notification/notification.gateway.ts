import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { EVENT_EMPLOYEE_PROFILE_UPDATED, EVENT_ATTENDANCE_SUBMITTED } from '../logger/logger.module';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ],
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const role = client.handshake.auth?.role;
    const userId = client.handshake.auth?.userId;
    this.logger.debug(`Client connected: id=${client.id} role=${role} userId=${userId}`);
    if (role === 'hrd' || role === 'admin') {
      client.join('admins');
      this.logger.debug(`Client ${client.id} joined room 'admins'`);
    }
    if (userId) {
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const rooms: any = (client as any).rooms;
    if (rooms && typeof rooms.forEach === 'function') {
      rooms.forEach((r: string) => client.leave(r));
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, payload: any) {
    return { event: 'pong', data: { ts: Date.now(), payload } };
  }

  @OnEvent(EVENT_EMPLOYEE_PROFILE_UPDATED)
  handleEmployeeUpdated(payload: any) {
    this.logger.debug(`Broadcasting profile update event to admins room`);
    const size = this.server.sockets.adapter.rooms.get('admins')?.size ?? 0;
    this.logger.debug(`Room 'admins' has ${size} sockets before emitting`);
    this.server.to('admins').emit('notification', {
      type: 'info' as const,
      title: 'Employee Data Updated',
      message: payload?.message || `Employee ${payload?.name || ''} updated their profile.`,
      data: payload,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent(EVENT_ATTENDANCE_SUBMITTED)
  handleAttendanceCreated(payload: any) {
    this.logger.debug(`Broadcasting attendance submitted event to admins room`);
    const size = this.server.sockets.adapter.rooms.get('admins')?.size ?? 0;
    this.logger.debug(`Room 'admins' has ${size} sockets before emitting`);
    this.server.to('admins').emit('notification', {
      type: 'success' as const,
      title: 'New Attendance Submitted',
      message: payload?.message || '',
      data: payload,
      timestamp: new Date().toISOString(),
    });
  }
}
