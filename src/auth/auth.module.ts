import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/database/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import config from 'src/helper/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from 'src/mail/mail.module';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    AuthenticationGuard,
    AuthorizationGuard
  ],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
        global: true
      }),
    }),
    MailModule
  ],
  exports: [
    JwtModule,
    AuthService,
    AuthenticationGuard,
    AuthorizationGuard
  ],
})
export class AuthModule { }
