import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-massege.dto';
import { PaginationDto } from './dto/pagination.dto';

@Controller('conversation')
@UseGuards(AuthenticationGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }
    @Post('conversations')
    async getOrCreateConversation(
        @Req() req,
        @Body() dto: CreateConversationDto,
    ) {
        return this.chatService.getOrCreateConversation(req.user.id, dto);
    }

    // All conversations
    @Get('conversations')
    async getAllConversations(@Req() req) {
        return this.chatService.getAllConversations(req.user.id);
    }

    // Unread conversations
    @Get('conversations/unread')
    async getUnreadConversations(@Req() req) {
        return this.chatService.getUnreadConversations(req.user.id);
    }

    // Active chats (with messages)
    @Get('conversations/active')
    async getActiveChats(@Req() req) {
        return this.chatService.getActiveChats(req.user.id);
    }

    // Send a message
    @Post('messages')
    async sendMessage(
        @Req() req,
        @Body() dto: CreateMessageDto,
    ) {
        return this.chatService.sendMessage(req.user.id, dto);
    }

    // Paginate messages in a conversation
    @Get('messages/:conversationId')
    async getMessages(
        @Req() req,
        @Param('conversationId', ParseIntPipe) conversationId: number,
        @Query() pagination: PaginationDto,
    ) {
        return this.chatService.getMessages(conversationId, pagination, req.user.id);
    }

    // Mark messages as read
    @Patch('messages/:conversationId/read')
    async markAsRead(
        @Req() req,
        @Param('conversationId', ParseIntPipe) conversationId: number,
    ) {
        return this.chatService.markMessagesAsRead(conversationId, req.user.id);
    }

    // Get unread count in a conversation
    @Get('messages/:conversationId/unread-count')
    async getUnreadCount(
        @Req() req,
        @Param('conversationId', ParseIntPipe) conversationId: number,
    ) {
        return this.chatService.getUnreadCount(conversationId, req.user.id);
    }

}
