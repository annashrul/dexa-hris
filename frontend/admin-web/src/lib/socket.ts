import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function createSocket(userId: string | number, role = 'hrd'): Socket {
  if (socketInstance) {
    socketInstance.disconnect();
  }
  socketInstance = io('http://localhost:3000', {
    auth: {
      userId,
      role,
    },
  });
  return socketInstance;
}

export function getSocket(): Socket | null {
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
