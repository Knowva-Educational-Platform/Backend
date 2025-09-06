import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
// import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { PrismaService } from 'src/database/prisma.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [ChatService, PrismaService,
    ChatGateway],
  controllers: [ChatController],
  imports: [AuthModule],
})
export class ChatModule { }
