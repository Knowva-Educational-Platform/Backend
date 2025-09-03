import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { UpdateChatDto } from './dto/update-chat.dto';
import { PrismaService } from 'src/database/prisma.service';
import { CreateConversationDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-massege.dto';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class ChatService {
  
  constructor(private prisma: PrismaService) {}

  // Get or create conversation
  async getOrCreateConversation(studentId: number, dto: CreateConversationDto) {
    let teacher = await this.prisma.user.findUnique({ where: { id: dto.teacherId , role: 'TEACHER' } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        studentId_teacherId: { studentId, teacherId: dto.teacherId },
      }
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { studentId, teacherId: dto.teacherId },
      });
    }

    return conversation;
  }

  // All conversations
  async getAllConversations(userId: number) {

    let conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ studentId: userId }, { teacherId: userId }] },
      include: {
        student: {
          select: { id: true, name: true, email: true},
        },
        teacher: {
          select: { id: true, name: true, email: true},
        },
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
    return conversations;
  }

  // Conversations with unread messages
  async getUnreadConversations(userId: number) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ studentId: userId }, { teacherId: userId }],
        messages: {
          some: {
            readAt: null,
            senderId: { not: userId },
          },
        },
      },
      include: {
        student: {
          select: { id: true, name: true, email: true},
        },
        teacher: {
          select: { id: true, name: true, email: true},
        },
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  // Active chats (has messages)
  async getActiveChats(userId: number) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ studentId: userId }, { teacherId: userId }],
        messages: { some: {} },
      },
      include: {
        student: {
          select: { id: true, name: true, email: true},
        },
        teacher: {
          select: { id: true, name: true, email: true},
        },
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  // Send message
  async sendMessage(userId: number, dto: CreateMessageDto) {
    Logger.warn('from service:', dto);
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.studentId !== userId && conversation.teacherId !== userId) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    return this.prisma.message.create({
      data: {
        content: dto.content,
        conversationId: dto.conversationId,
        senderId: userId,
      },
    });
  }

  // Paginate messages
  async getMessages(conversationId: number, pagination: PaginationDto, userId: number) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.studentId !== userId && conversation.teacherId !== userId) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    });
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: number, userId: number) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  // Count unread messages per conversation
  async getUnreadCount(conversationId: number, userId: number) {
    return this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
    });
  }
}


