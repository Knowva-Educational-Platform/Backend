import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { UpdateChatDto } from './dto/update-chat.dto';
import { PrismaService } from 'src/database/prisma.service';
import { CreateConversationDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-massege.dto';
import { PaginationDto } from './dto/pagination.dto';
import { User } from '@prisma/client';

@Injectable()
export class ChatService {

  constructor(private prisma: PrismaService) { }

  /// Get or create direct conversation
  async getOrCreateConversation(studentId: number, dto: CreateConversationDto) {
    let teacher = await this.prisma.user.findUnique({
      where: { id: dto.teacherId, role: 'TEACHER' }
    });
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
        data: {
          studentId,
          teacherId: dto.teacherId,
          isGroup: false // explicitly set as direct conversation
        },
      });
    }

    return conversation;
  }

  // Get or create group conversation
  async getOrCreateGroupConversation(groupId: number) {
    if (!groupId) throw new NotFoundException('Group not found');
    let group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    let conversation = await this.prisma.conversation.findUnique({
      where: { groupId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          groupId,
          isGroup: true // explicitly set as group conversation
        },
      });
    }

    

    return conversation ;
  }

  // All conversations (both direct and group)
  async getAllConversations(userId: number) {
    let conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          // Direct conversations
          { studentId: userId, isGroup: false },
          { teacherId: userId, isGroup: false },
          // Group conversations where user is a member of the group
          {
            isGroup: true,
            group: {
              memberships: {
                some: {
                  studentId: userId,
                  status: 'APPROVED' // only approved memberships
                }
              }
            }
          }
        ]
      },
      include: {
        // Direct conversation participants
        student: {
          select: { id: true, name: true, email: true },
        },
        teacher: {
          select: { id: true, name: true, email: true },
        },
        // Group conversation info
        group: {
          select: {
            id: true,
            name: true,
            capacity: true,
            subject: {
              select: { id: true, title: true, description: true }
            },
            memberships: {
              where: { status: 'APPROVED' },
              select: {
                student: { select: { id: true, name: true, email: true } }
              }
            }
          },
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
        OR: [
          // Direct conversations with unread messages
          {
            studentId: userId,
            isGroup: false,
            messages: {
              some: {
                readAt: null,
                senderId: { not: userId },
              },
            }
          },
          {
            teacherId: userId,
            isGroup: false,
            messages: {
              some: {
                readAt: null,
                senderId: { not: userId },
              },
            }
          },
          // Group conversations with unread messages
          {
            isGroup: true,
            group: {
              memberships: {
                some: {
                  studentId: userId,
                  status: 'APPROVED'
                }
              }
            },
            messages: {
              some: {
                senderId: { not: userId },
                // For groups, check if user ID is NOT in readBy array
                NOT: {
                  readBy: {
                    has: userId.toString()
                  }
                }
              },
            }
          }
        ],
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        teacher: {
          select: { id: true, name: true, email: true },
        },
        group: {
          select: {
            id: true,
            name: true,
            capacity: true,
            subject: {
              select: { id: true, title: true, description: true }
            },
            memberships: {
              where: { status: 'APPROVED' },
              select: {
                student: { select: { id: true, name: true, email: true } }
              }
            }
          },
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
        OR: [
          // Direct conversations
          { studentId: userId, isGroup: false },
          { teacherId: userId, isGroup: false },
          // Group conversations
          {
            isGroup: true,
            group: {
              memberships: {
                some: {
                  studentId: userId,
                  status: 'APPROVED'
                }
              }
            }
          }
        ],
        messages: { some: {} },
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        teacher: {
          select: { id: true, name: true, email: true },
        },
        group: {
          select: {
            id: true,
            name: true,
            capacity: true,
            subject: {
              select: { id: true, title: true, description: true }
            },
            memberships: {
              where: { status: 'APPROVED' },
              select: {
                student: { select: { id: true, name: true, email: true } }
              }
            }
          },
        },
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  // Send message (works for both direct and group chats)
  async sendMessage(userId: number, dto: CreateMessageDto) {
    Logger.warn('from service:', dto);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
      include: {
        group: {
          include: {
            memberships: {
              where: { status: 'APPROVED' },
              include: { student: true }
            }
          }
        }
      }
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    // ===== Check permissions =====
    let hasPermission = false;

    if (conversation.isGroup) {
      const group = conversation.group;
      if (!group) throw new NotFoundException('Group not found');

      // Student must be approved OR teacher (createdBy)
      const isStudent = group.memberships.some(m => m.studentId === userId);
      const isTeacher = group.createdById === userId;

      hasPermission = isStudent || isTeacher;
    } else {
      // Direct conversation
      hasPermission =
        conversation.studentId === userId ||
        conversation.teacherId === userId;
    }

    if (!hasPermission) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    // ===== Prepare message =====
    const messageData = {
      content: dto.content,
      conversationId: dto.conversationId,
      senderId: userId,
      mediaUrl: dto.mediaUrl,
      mediaType: dto.mediaType,
    };

    let deliveredTo: string[] = [];
    let readBy: string[] = [];

    if (conversation.isGroup) {
      const group = conversation.group;
      if (!group) throw new NotFoundException('Group not found');

      // Collect all approved students except sender
      const memberIds =
        group.memberships
          .filter(m => m.studentId !== userId)
          .map(m => m.studentId.toString()) || [];

      // Include teacher (createdById) if not the sender
      if (group.createdById && group.createdById !== userId) {
        memberIds.push(group.createdById.toString());
      }

      deliveredTo = memberIds;
      readBy = []; // updated later
    }



    let messages = this.prisma.message.create({
      data: {
        ...messageData,
        deliveredTo,
        readBy,
      },
    });

    return messages;
  }


  // Paginate messages
  async getMessages(conversationId: number, pagination: PaginationDto, userId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        group: {
          include: {
            memberships: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    // ===== Check permissions =====
    let hasPermission = false;

    if (conversation.isGroup) {
      const group = conversation.group;
      if (!group) throw new NotFoundException('Group not found');

      // Student must be approved OR teacher (createdBy)
      const isStudent = group.memberships.some(m => m.studentId === userId);
      const isTeacher = group.createdById === userId;

      hasPermission = isStudent || isTeacher;
    } else {
      // Direct conversation
      hasPermission =
        conversation.studentId === userId ||
        conversation.teacherId === userId;
    }

    if (!hasPermission) {
      throw new ForbiddenException('You are not part of this conversation');
    }
    let skip = pagination.skip > 0 ? pagination.skip : 0;
    let take = pagination.take > 0 ? pagination.take : 10;
    let messages = await this.prisma.message.findMany({
      where: { conversationId: conversationId },
      orderBy: { timestamp: 'desc' },
      skip,
      take
    })
    return messages;
  }

  // Mark messages as read (handles both direct and group)
  async markMessagesAsRead(conversationId: number, userId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        group: {
          include: {
            memberships: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    // ===== Check permissions =====
    let hasPermission = false;

    if (conversation.isGroup) {
      const group = conversation.group;
      if (!group) throw new NotFoundException('Group not found');

      // Student must be approved OR teacher (createdBy)
      const isStudent = group.memberships.some(m => m.studentId === userId);
      const isTeacher = group.createdById === userId;

      hasPermission = isStudent || isTeacher;
    } else {
      // Direct conversation
      hasPermission =
        conversation.studentId === userId ||
        conversation.teacherId === userId;
    }

    if (!hasPermission) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    if (conversation.isGroup) {
      const unreadMessages = await this.prisma.message.findMany({
        where: {
          conversationId,
          senderId: { not: userId },
          NOT: {
            readBy: {
              has: userId.toString()
            }
          }
        }
      });

      for (const message of unreadMessages) {
        await this.prisma.message.update({
          where: { id: message.id },
          data: {
            readBy: { push: userId.toString() }
          }
        });
      }
    } else {
      await this.prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt:  new Date() },
      });
    }
  }

  // Count unread messages per conversation
  async getUnreadCount(conversationId: number, userId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        group: {
          include: {
            memberships: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    });

    if (!conversation) return 0;

    // ===== Check permissions =====
    let hasPermission = false;

    if (conversation.isGroup) {
      const group = conversation.group;
      if (!group) throw new NotFoundException('Group not found');

      // Student must be approved OR teacher (createdBy)
      const isStudent = group.memberships.some(m => m.studentId === userId);
      const isTeacher = group.createdById === userId;

      hasPermission = isStudent || isTeacher;
    } else {
      // Direct conversation
      hasPermission =
        conversation.studentId === userId ||
        conversation.teacherId === userId;
    }

    if (!hasPermission) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    if (conversation.isGroup) {
      return this.prisma.message.count({
        where: {
          conversationId,
          senderId: { not: userId },
          NOT: {
            readBy: {
              has: userId.toString()
            }
          }
        },
      });
    } else {
      return this.prisma.message.count({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt: null,
        },
      });
    }
  }
  // chat.service.ts
  async getConversationById(conversationId: number) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        group: {
          include: {
            memberships: {
              where: { status: 'APPROVED' }, // students only
              include: { student: true },
            },
          },
        },
      },
    });
  }

}


