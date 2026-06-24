import { Server, Socket } from 'socket.io';
import prisma from './prisma';

export const initSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    // When a user logs in, they join a room with their user ID
    socket.on('join', (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
    });

    socket.on('sendMessage', async (data: { message: any, receiverIds: string[] }) => {
      try {
        // Emit to all participants including the sender (if multiple devices)
        const participants = [...data.receiverIds, data.message.senderId];
        participants.forEach(id => {
          io.to(id).emit('newMessage', data.message);
        });

      } catch (error) {
        console.error('Error handling sendMessage event:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
