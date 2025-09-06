import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { PrismaService } from 'src/database/prisma.service';
import { NotificationModule } from 'src/notification/notification.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [EnrollmentController],
  providers: [EnrollmentService, PrismaService],
  imports: [AuthModule, NotificationModule],
})
export class EnrollmentModule { }
