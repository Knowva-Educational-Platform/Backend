import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
// import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';
import { ChatGateway } from './chat.gateway';

@Module({
  providers: [ ChatService, PrismaService ,
     ChatGateway],
  controllers: [ChatController],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
        global: true
      }),
      inject: [ConfigService],
    }),
  ],
})
export class ChatModule { }
