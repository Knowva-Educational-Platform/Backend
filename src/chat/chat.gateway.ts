import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, WsException } from '@nestjs/websockets';
import { ChatService } from './chat.service';

import { UpdateChatDto } from './dto/update-chat.dto';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-massege.dto';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/guards/ws.guard';
import { JwtService } from '@nestjs/jwt';


@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<number, string> = new Map();

  constructor(private readonly chatService: ChatService , private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
  try {
    const token = client.handshake.headers['authorization']?.split(' ')[1];
    if (!token) {
      throw new WsException('Missing auth token');
    }

    const payload = await this.jwtService.verifyAsync(token);
    (client as any).user = payload; // attach user to socket
    Logger.log('WS Authenticated user:', payload);

    // ✅ Store mapping userId -> socketId
    this.connectedUsers.set(payload.id, client.id);
    Logger.log(`User ${payload.id} connected on socket ${client.id}`);
  } catch (err) {
    Logger.error('WS Auth failed:', err.message);
    client.disconnect();
  }
}


  async handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
  }

  // ✅ Send new message
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: any,
  ) {
    Logger.log('OG from websocket payload:', dto);
    // const payload = Array.isArray(dto) ? dto[0] : dto;
    const payload = typeof dto === 'string' ? JSON.parse(dto) : dto;

    Logger.log('Parsed DTO:', payload);
    
    const user = (client as any).user;
    Logger.warn('Authenticated user from websocket:', user);
    const message = await this.chatService.sendMessage(user.id, payload as CreateMessageDto);

    client.emit('message_sent', message);

    // Find recipient
    const conv = await this.chatService.getAllConversations(user.id);
    const conversation = conv.find(c => c.id === Number(payload.conversationId));
    if (!conversation) return;

    const recipientId =
      conversation.studentId === user.id
        ? conversation.teacherId
        : conversation.studentId;

    const recipientSocket = this.connectedUsers.get(recipientId);
    Logger.log('Recipient socket ID:', recipientSocket);
    if (recipientSocket) {
      this.server.to(recipientSocket).emit('new_message', message);

      const unreadCount = await this.chatService.getUnreadCount(
        payload.conversationId,
        recipientId,
      );
      this.server.to(recipientSocket).emit('unread_count', {
        conversationId: payload.conversationId,
        unreadCount,
      });
    }

    return message;
  }

  // ✅ Mark messages as read
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const user = (client as any).user;
    await this.chatService.markMessagesAsRead(data.conversationId, user.id);

    const unreadCount = await this.chatService.getUnreadCount(
      data.conversationId,
      user.id,
    );

    client.emit('unread_count', {
      conversationId: data.conversationId,
      unreadCount,
    });
  }


}
